const DB = require('../db/DB');
const bcrypt = require('bcrypt');
const shortid = require('shortid');
const path = require('path');

const { printLog } = require('../utils/logger');
const DEV_PROD_VARIABLE = require('../config/config');

const DEFAULT_NAME = '[passport]';

module.exports = function(app) {
    const passport = require('passport');
    const LocalStrategy = require('passport-local').Strategy;
    const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

    app.use(passport.initialize());
    app.use(passport.session());

    passport.serializeUser(function(user, done) {
        console.log('serializeUser', user);
        done(null, user.M_ID);
    });
    passport.deserializeUser(function(id, done) {
        console.log('deserializeUser', id);
        done(null, id);
    });

    passport.use(new LocalStrategy({
            usernameField: 'm_id',
            passwordField: 'm_pw'
        },
        function(username, password, done) {

            DB.query(`
                SELECT * FROM TBL_MEMBER WHERE M_ID = ? AND M_IS_DELETED = 0
            `, [username], (err, member) => {

                if (err) {
                    printLog(DEFAULT_NAME, 'local login err', err);
                    done(null, false, { message: '서버 통신 중 문제가 발생했습니다.' })
                } else {

                    // id 가 있는 경우
                    if (member.length > 0) {

                        // 비밀번호가 일치하는 경우
                        if (bcrypt.compareSync(password, member[0].M_ID)) {

                            // 계정 정지된 사용자인 경우
                            if (Number(member[0].M_IS_SUSPEND) === 1) {
                                done(null, false, { message: '사용 정지된 ID입니다. 관리자에게 문의하세요.' })
                            
                            // 정상 이용자
                            } else {
                                done(null, member[0], { message: '로그인 성공했습니다.' });
                            }

                        // 비밀번호가 일치하지 않는 경우
                        } else {
                            done(null, false, { message: '비밀번호가 일치하지 않습니다.' })

                        }

                    // id가 없는 경우
                    } else {
                        done(null, false, { message: '입력한 ID는 존재하지 않습니다.' })

                    }

                }

            })

        }
    ))

    let googleCredentials_Dev = require('../config/google.json');

    passport.use(new GoogleStrategy({
            clientID: googleCredentials_Dev.web.client_id,
            clientSecret: googleCredentials_Dev.web.client_secret,
            callbackURL: DEV_PROD_VARIABLE.REDIRECT_URIS,
        },
        function(accessToken, refreshToken, profile, done) {

            let email = profile.emails[0].value;

            DB.query(`
                SELECT * FROM TBL_MEMBER WHERE M_GOOGLE_ID = ? AND M_IS_DELETED = 0
            `, [], (err0, g_member) => {

                if (err0) {
                    printLog(DEFAULT_NAME, 'google login find M_GOOGLE_ID err0', err0)
                    done(null, false, { message: '서버 통신 중 문제가 발생했습니다.' })

                } else {

                    // 구글 아이디로 가입된 계정이 있는 경우
                    if (profile.id === g_member[0].M_GOOGLE_ID) {

                        // 계정 정지 상태
                        if (Number(g_member[0].M_IS_SUSPEND) === 1) {
                            done(null, false, { message: '사용 정지된 ID입니다. 관리자에게 문의하세요.' })

                        // 정상 이용자
                        } else {
                            done(null, g_member[0], { message: '로그인에 성공했습니다.' })

                        }

                    // 구글 아이디로 가입된 계정이 없는 경우
                    } else {

                        // g-mail 과 같은 m-mail 있는지 검색
                        DB.query(`
                            SELECT * FROM TBL_MEMBER WHERE M_MAIL = ? AND M_IS_DELETED = 0
                        `, [email], (err, member) => {

                            if(err) {
                                printLog(DEFAULT_NAME, 'google login err', err);
                                done(null, false, {message: '서버 통신 중 문제가 발생했습니다.'})
            
                            } else {
            
                                // m_mail이 google mail과 일치하는 경우
                                if(member.length > 0) {

                                    // 일치하는 mail이 있지만 계정 정지된 경우
                                    if (Number(member[0].M_IS_SUSPEND) === 1) {
                                        done(null, false, { message: '사용 정지된 ID입니다. 관리자에게 문의하세요.' })

                                    // mail이 일치하는 하고 계정이 정지 안된 경우
                                    } else {
                                        // m_goolge_id 컬럼에 profile.id 값 입력
                                        DB.query(`
                                            UPDATE 
                                                TBL_MEMBER
                                            SET 
                                                M_GOOGLE_ID = ?
                                            WHERE
                                                M_NO = ?
                                        `, [profile.id, member[0].M_NO], (err2, result) => {
                
                                            if(err2) {
                                                printLog(DEFAULT_NAME, 'goolge login err2', err2)
                                                done(null, false, {message:'서버 통신 중 문제가 발생했습니다.'})
                
                                            } else {
                                                done(null, member[0], {message: '로그인에 성공했습니다.'})
    
                                            }
                                        })

                                    }

                                // google mail과 일치하는 mail이 없는 경우
                                } else {
            
                                    // shortid를 이용해 id, pw 생성 후 DB 입력.
                                    let id = shortid();
                                    let pw = shortid();
            
                                    DB.query(`
                                        INSERT INTO
                                            TBL_MEMBER(
                                                M_ID,
                                                M_PW,
                                                M_NAME,
                                                M_MAIL,
                                                M_PHONE,
                                                M_GENDER
                                            )
                                        VALUES(?, ?, ?, ?, ?, ?)
                                    `, [id, bcrypt.hashSync(pw, 10), profile.displayName, email, '--', ''], (err3, result) => {
            
                                        if(err) {
                                            printLog(DEFAULT_NAME, 'google login err3', err3);
                                            done(null, false, {message: '서버 통신 중 문제가 발생했습니다.'});
            
                                        } else {
                                            DB.query(`
                                                SELECT * FROM TBL_MEMBER WHERE M_ID = ?
                                            `, [id], (err, member) => {
            
                                                done(null, member[0], {message: '구글 로그인에 성공했습니다.'});
                                            })
                                        }
            
                                    })
            
                                }
                            }
            
                        })

                    }

                }

            })

        }
    ));

    return passport;

}
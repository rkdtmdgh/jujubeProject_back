const DB = require("../db/DB");
const bcrypt = require('bcrypt');
const { printLog } = require("../utils/logger");
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const shortid = require('shortid');

const googleJson = require('../config/google.json');
const DEV_PROD_VARIABLE = require("../config/config");
const { verifyToken, makeAccessToken, makeRefreshToken } = require("../utils/jwt");

const DEFAULT_NAME = '[memberService]';

const memberService = {

    sign_up_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'sign_up_confirm');

        let post = req.body;

        let sql = `
            INSERT INTO
                TBL_MEMBER(
                    M_ID,
                    M_PW,
                    M_NAME,
                    M_MAIL,
                    M_PHONE,
                    M_GENDER
                    ${ post.m_self_introduction !== undefined ? `, M_SELF_INTRODUCTION` : `` }
                    ${ req.file !== undefined ? `, M_PROFILE_THUMBNAIL` : `` }
            ) 
            values(?, ?, ?, ?, ?, ?
                ${ post.m_self_introduction !== undefined ? `, ?` : `` }
                ${ req.file !== undefined ? `, ?` : `` }
            )
        `;

        let state = [post.m_id, bcrypt.hashSync(post.m_pw, 10), post.m_name, post.m_mail, post.m_phone, post.m_gender];

        if(post.m_self_introduction !== undefined) state.push(post.m_self_introduction);
        if(req.file !== undefined) state.push(req.file.filename);

        DB.query(sql, state, (err, result) => {

            if (err) {
                res.json(null);
                return;
            }

            if (result.affectedRows > 0) {
                res.json(result.affectedRows)

            } else {
                res.json(result.affectedRows)

            }

        })

    },

    sign_in_confirm: async (req, res) => {
        printLog(DEFAULT_NAME, 'sign_in_confirm');

        try {
            let conn = await pool.getConnection(async conn => conn);
            let sql = `SELECT * FROM TBL_MEMBER WHERE M_ID = ? AND M_IS_DELETED = 0`;

            let [member] = await conn.query(sql, [req.body.m_id]);

            if (!member[0]) {
                printLog(DEFAULT_NAME, '존재하지 않는 아이디입니다');
                return res.json({
                    result: -2,
                    message: '존재하지 않는 아이디입니다'
                });
            }

            if (Number(member[0].M_IS_SUSPEND) === 1) {
                printLog(DEFAULT_NAME, '계정 정지된 사용자입니다.');
                return res.json({
                    result: -3,
                    message: '사용 정지된 ID입니다.'
                })
            }

            if (bcrypt.compareSync(req.body.m_pw, member[0].M_PW)) {

                const accessToken = makeAccessToken(member[0].M_ID);
                const refreshToken = makeRefreshToken(member[0])

                return res.cookie('accessToken', accessToken)
                        .cookie('refreshToken', refreshToken)
                        .json({
                            sessionID: accessToken,
                            loginedMember: req.body.m_id,
                            message: '로그인에 성공했습니다.',
                        });

            } else {
                printLog(DEFAULT_NAME, '비밀번호 오류입니다.');
                return res.cookie('accessToken', '')
                        .json({
                            result: -4,
                            message: '비밀번호 오류입니다.'
                        });
            }

        } catch (error) {
            printLog(DEFAULT_NAME, `/sign_in_confirm error`, error);
            res.json(null);
        }

    },
    

    
    google_sign_in_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'google_sign_in_confirm');

        let post = req.body.decoded;
        printLog(DEFAULT_NAME, 'post---', post);

        DB.query(`
                SELECT * FROM TBL_MEMBER WHERE M_GOOGLE_ID = ? AND M_IS_DELETED = 0
            `, [post.id], (err0, g_member) => {

                if (err0) {
                    printLog(DEFAULT_NAME, 'google login find M_GOOGLE_ID err0', err0)
                    return res.json(null);

                } 

                // post.id 값과 일치하는 구글 계정이 있는 경우
                if (g_member.length > 0) {

                    // 계정 정지 상태
                    if (Number(g_member[0].M_IS_SUSPEND) === 1) {
                        printLog(DEFAULT_NAME, '계정 정지된 사용자입니다.');
                        res.json(-3);

                    // 정상 이용자
                    } else {
                        printLog(DEFAULT_NAME, '구글 로그인에 성공했습니다.');

                        const accessToken = makeAccessToken(g_member[0].M_ID);
                        const refreshToken = makeRefreshToken(g_member[0]);

                        return res.cookie('accessToken', accessToken)
                                .cookie('refreshToken', refreshToken)
                                .json({
                                    sessionID: accessToken,
                                    loginedMember: g_member[0].M_ID,
                                    message: '로그인에 성공했습니다.',
                                });

                    }
                } else {

                    // 구글 아이디로 가입된 계정이 없는 경우

                    // g-mail 과 같은 m-mail 있는지 검색
                    DB.query(`
                        SELECT * FROM TBL_MEMBER WHERE M_MAIL = ? AND M_IS_DELETED = 0
                    `, [post.email], (err, member) => {

                        if(err) {
                            printLog(DEFAULT_NAME, 'google login err', err);
                            return res.json(null);

                        } 
        
                        // m_mail이 google mail과 일치하는 경우
                        if(member.length > 0) {

                            // 일치하는 mail이 있지만 계정 정지된 경우
                            if (Number(member[0].M_IS_SUSPEND) === 1) {
                                printLog(DEFAULT_NAME, '계정 정지된 사용자입니다.');
                                return res.json(-3);

                            } 
                            
                            // mail이 일치하는 하고 계정이 정지 안된 경우
                            // m_goolge_id 컬럼에 post.id 값 입력
                            DB.query(`
                                UPDATE 
                                    TBL_MEMBER
                                SET 
                                    M_GOOGLE_ID = ?
                                WHERE
                                    M_NO = ?
                            `, [post.id, member[0].M_NO], (err2, result) => {
    
                                if(err2) {
                                    printLog(DEFAULT_NAME, 'goolge login err2', err2)
                                    return res.json(null);
                                    
                                } 

                                printLog(DEFAULT_NAME, '구글 로그인에 성공했습니다.');

                                const accessToken = makeAccessToken(member[0].M_ID);
                                const refreshToken = makeRefreshToken(member[0]);
                
                                return res.cookie('accessToken', accessToken)
                                        .cookie('refreshToken', refreshToken)
                                        .json({
                                            sessionID: accessToken,
                                            loginedMember: member[0].M_ID,
                                            message: '로그인에 성공했습니다.',
                                        });
                                    
                                
                            })

                            

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
                                        M_GENDER,
                                        M_GOOGLE_ID
                                    )
                                VALUES(?, ?, ?, ?, ?, ?, ?)
                            `, [id, bcrypt.hashSync(pw, 10), post.name, post.email, '--', 'M', post.id], (err3, result) => {

                                if(err3) {
                                    printLog(DEFAULT_NAME, 'google login err3', err3);
                                    res.json(-3);

                                } else {
                                    DB.query(`
                                        SELECT * FROM TBL_MEMBER WHERE M_ID = ?
                                    `, [id], (err4, insert_member) => {

                                        if(err4) {
                                            printLog(DEFAULT_NAME, 'google login err4', err4);
                                            res.json(-3);
                                        } else {

                                            printLog(DEFAULT_NAME, '구글 로그인에 성공했습니다.');

                                            const accessToken = makeAccessToken(insert_member[0].M_ID);
                                            const refreshToken = makeRefreshToken(insert_member[0]);
                            
                                            return res.cookie('accessToken', accessToken)
                                                    .cookie('refreshToken', refreshToken)
                                                    .json({
                                                        sessionID: accessToken,
                                                        loginedMember: insert_member[0].M_ID,
                                                        message: '로그인에 성공했습니다.',
                                                    });

                                        }

                                    })

                                }

                            })

                        }

                    })

                }

            })

    },

    get_member: async function(req, res) {
        printLog(DEFAULT_NAME, 'get_member');

        try {
            
            let accessToken =  req.cookies.accessToken;
            let refreshToken = req.cookies.refreshToken;
    
            jwt.verify(accessToken, DEV_PROD_VARIABLE.ACCESS_SECRET, (err, access) => {
    
                if(err) {
                    printLog(DEFAULT_NAME, 'get_member 유효하지 않은 access 토큰', err);
                    res.json(-1);

                } else {
                    printLog(DEFAULT_NAME, 'get_member 유효한 access 토큰', access);
                    
                    jwt.verify(refreshToken, DEV_PROD_VARIABLE.REFRESH_SECRET, (err, refresh) => {

                        if (err) { 
                            printLog(DEFAULT_NAME, 'get_member 유효하지 않은 refresh 토큰', err);
                            res.json(-1);

                        } else {
                            printLog(DEFAULT_NAME, 'get_member 유효한 refresh 토큰', refresh);

                            accessToken = makeAccessToken(refresh.M_ID);

                            DB.query(`
                                SELECT * FROM TBL_MEMBER WHERE M_ID = ?
                            `, [refresh.M_ID], (err, member) => {

                                if(err) {
                                    printLog(DEFAULT_NAME, 'get_member err', err);
                                    res.json(-1);
                                } else {
                                    printLog(DEFAULT_NAME, 'get_member result', member);

                                    res.cookie('accessToken', accessToken)
                                        .json({
                                            sessionID: accessToken,
                                            member: member[0],
                                        });

                                }

                            })

                        }

                    })

                }

            })

        } catch (error) {
            printLog(DEFAULT_NAME, 'get_member error', error)
            res.json(null);
        }

    },

    get_search_member: (req, res) => {
        printLog(DEFAULT_NAME, 'get_search_member');

        DB.query(`
            SELECT * FROM TBL_MEMBER WHERE M_ID LIKE ? ORDER BY M_ID ASC 
        `, [`%${req.query.search_member}%`], (err, members) => {

            if(err) {
                printLog(DEFAULT_NAME, 'get search member err', err);
                res.json(null);
            } else {
                printLog(DEFAULT_NAME, 'get search member result', members);
                res.json(members);
            }

        })

    },

    modify_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'modify_confirm');

        let post = req.body;

        let sql = `
            UPDATE 
                TBL_MEMBER
            SET 
                M_NAME = ?,
                M_MAIL = ?,
                M_PHONE = ?,
                M_GENDER = ?
                ${ post.m_self_introduction !== undefined ? `, M_SELF_INTRODUCTION = ?` : `` }
                ${ req.file !== undefined ? `, M_PROFILE_THUMBNAIL = ?` : `` }
            WHERE 
                M_ID = ?
        `;

        let state = [post.m_name, post.m_mail, post.m_phone, post.m_gender];

        if(post.m_self_introduction !== undefined) state.push(post.m_self_introduction);
        if(req.file !== undefined) state.push(req.file.filename);

        state.push(post.m_id);

        DB.query(sql, state, (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'modify confirm err', err);
                res.json(null);

            } else {

                DB.query(`
                    SELECT * FROM TBL_MEMBER WHERE M_ID = ?
                `, [post.m_id], (err2, member) => {

                    if(err) {
                        printLog(DEFAULT_NAME,'modify confirm err2', err);
                        return res.json(null);
                    }

                    const refreshToken = makeRefreshToken(member[0]);

                    res.cookie('refreshToken', refreshToken)
                        .json({result: result.changedRows})
                })

            }

        })

    },

    sign_out_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'sign_out_confirm');

        res.cookie('accessToken', '');
        res.json(null);

    },

    delete_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'delete_confirm');

        let m_id = verifyToken(req.cookies.accessToken).m_id;

        DB.query(`
            UPDATE 
                TBL_MEMBER 
            SET 
                M_IS_DELETED = 1,
                M_DELETED_DATE = NOW()
            WHERE 
                M_ID = ?
        `, [m_id], (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'delete confirm err', err);
                res.json(null)

            } else {

                res.json({ result: result.changedRows });

            }

        })

    },

    friend_request: (req, res) => {
        printLog(DEFAULT_NAME, 'friend_request');

        let post = {
            fr_req_id: 'hooka',
            fr_res_id: 'gilong',
            fr_ilchon_name: '후카친구'
        }

        DB.query(`
            SELECT * FROM 
                TBL_FRIEND_REQUEST 
            WHERE 
                FR_REQ_ID = ?
            AND
                FR_RES_ID = ?
        `, [req.user, post.fr_res_id], (err1, cnt) => {

            if(err1) {
                printLog(DEFAULT_NAME, 'friend_request err1', err1);
                res.json(null)

            } else {
                // 이미 친구신청 한경우. result = 3
                if(cnt.length > 0) {

                    res.json({ result: 3 });

                // 친구 신청 안한 경우 새로 신청
                } else {

                    DB.query(`
                        INSERT INTO
                            TBL_FRIEND_REQUEST(
                                FR_REQ_ID,
                                FR_RES_ID,
                                FR_ILCHON_NAME
                            )
                        VALUES(?, ?, ?)
                    `, [req.user, post.fr_res_id, post.fr_ilchon_name], (err, result) => {
            
                        if (err) {
                            printLog(DEFAULT_NAME, 'friend request err', err);
                            res.json(null);
            
                        // 신청 완료. 제대로 등록 시 result = 1, 실패 시 result = 0
                        } else {
                            printLog(DEFAULT_NAME, 'friend request result', result);
                            res.json({ result: result.affectedRows })
            
                        }
            
                    })

                }

            }

        })

    },

    friend_confirm: async (req, res) => {
        printLog(DEFAULT_NAME, 'friend_confirm');

        let post = req.body;

        let conn1 = await pool.getConnection(async conn => conn);
        let conn2 = await pool.getConnection(async conn => conn);

        let sql1 = `
            INSERT INTO 
                TBL_FRIEND(
                    F_OWNER_ID,
                    F_ID,
                    F_ILCHON_NAME,
                )
            VALUES(?, ?, ?)
        `;

        let sql2 = `
            INSERT INTO 
                TBL_FRIEND(
                    F_OWNER_ID,
                    F_ID,
                    F_ILCHON_NAME,
                )
            VALUES(?, ?, ?)
        `;

        conn1.beginTransaction();
        conn2.beginTransaction();

        try {

            // 로그인 user의 친구 목록에 수락한 친구 추가.
            let [result1] = await conn1.query(sql1, [req.user, ``, ``]);

            // 친구 추가 성공 시.
            if (result1.affectedRows > 0) {
                
                try {

                    // 반대의 경우. 수락한 친구의 친구 목록에 로그인 user 추가.
                    let [result2] = await conn2.query(sql2, [``, res.user, ``]);

                    // 양쪽 친구 록에 친구 추가 성공 시.
                    if (result2.affectedRows > 0) {
                        conn1.commit();
                        conn2.commit();
                        res.json({
                            result: result2.affectedRows
                        });

                    // result2 실패 시 result1이랑 둘 다 rollback
                    } else {
                        conn1.rollback();
                        conn2.rollback();
                        res.json({
                            result: result2.affectedRows
                        });
                    }

                } catch (error2) {
                    printLog(DEFAULT_NAME, 'friend confirm error', error2)
                    conn1.rollback();
                    conn2.rollback();
                    res.json(null);
                }

            } else {
                printLog(DEFAULT_NAME, 'friend confirm fail', result1.affectedRows);
                conn1.rollback();
                res.json({
                    result: result1.affectedRows
                });
            }

        } catch (error) {
            printLog(DEFAULT_NAME, 'friend confirm error', error);
            conn1.rollback();
            conn2.rollback();
            res.json(null);

        } finally {
            conn1.release();
            conn2.release();

        }

    },

    friend_delete_confirm: async (req, res) => {
        printLog(DEFAULT_NAME, 'friend_delete_confirm');

        let post = req.body;

        let conn1 = await pool.getConnection(async conn => conn);
        let conn2 = await pool.getConnection(async conn => conn);

        let sql1 = `
            DELETE FROM 
                TBL_FRIEND 
            WHERE 
                F_OWNER_ID = ? 
            AND 
                F_ID = ? 
        `;

        let sql2 = `
            DELETE FROM 
                TBL_FRIEND 
            WHERE 
                F_OWNER_ID = ? 
            AND 
                F_ID = ?
        `;

        conn1.beginTransaction();
        conn2.beginTransaction();

        try {

            let [result1] = await conn1.query(sql1, [req.user, ``]);

            if(result1.affectedRows > 0) {

                try {

                    let [result2] = await conn2.query(sql2, [``, req.user]);

                    if(result2.affectedRows > 0) { 

                        conn1.commit();
                        conn2.commit();
                        res.json({
                            result: result2.affectedRows
                        });

                    } else {
                        conn1.rollback();
                        conn2.rollback();
                        res.json({
                            result: result2.affectedRows
                        });
                    }

                } catch (error1) {
                    printLog(DEFAULT_NAME, 'friend_delete_confirm error1', error1);
                    res.json(null);
                }

            } else {
                conn1.rollback();
                res.json({
                    result: result1.affectedRows
                });
            }

        } catch (error) {
            printLog(DEFAULT_NAME, 'friend_delete_confirm error', error);
            res.json(null);
        } finally {
            conn1.release();
            conn2.release();
        }

    },

    get_friend_count: (req, res) => {
        printLog(DEFAULT_NAME, 'get_friend_count');

        let token = req.cookies.accessToken;
        let m_id=  verifyToken(token).m_id;
        console.log('m_id--', m_id);

        sql = `
            SELECT 
                COUNT(*) AS FRIEND_COUNT 
            FROM 
                TBL_FRIEND 
            WHERE 
                F_OWNER_ID = ? 
        `;

        DB.query(sql, [m_id], (err, friend_cnt) => {

            if(err) {
                printLog(DEFAULT_NAME, 'get_friend_count err', err);
                return res.json(null);
            }

            res.json({
                friend_count: friend_cnt[0].FRIEND_COUNT
            });

        })

    },

    get_friend_list: (req, res) => {
        printLog(DEFAULT_NAME, 'get_friend_list');

        sql = `
            SELECT 
                F_ID,
                F_ILCHON_NAME 
            FROM 
                TBL_FRIEND 
            WHERE 
                F_OWNER_ID = ? 
            AND 
                F_IS_BLOCK = 0
        `;

        DB.query(sql, [m_id], (err, friend_list) => {

            if (err) {
                printLog(DEFAULT_NAME, 'get_friend_list err', err);
                return res.json(null);
            }

            res.json({
                friend_list: friend_list
            });

        })

    },

}

module.exports = memberService;
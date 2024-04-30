const express = require('express');
const app = express();
const { PORT } = require('./lib/config/config');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const { printLog } = require('./lib/utils/logger');
const cookieParser = require("cookie-parser");
const DB = require('./lib/db/DB');
const pool = require('./lib/db/pool');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

let pp = require('./lib/passport/passport');

const DEV_PROD_VARIABLE = require('./lib/config/config');

const DEFAULT_NAME = '[main]';

app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}));  
app.use(compression());   

const DAFAULT_NAME = '[main]';

// SESSION SETTING START
let maxAge = 1000 * 60 * 30;
const sessionObj = {
    secret: "jujubeProject",
    resave: false,
    saveUninitialized: true,
    store: new session.MemoryStore({ checkPeriod : maxAge }),
    cookie: {
        maxAge: maxAge,
    },
}

app.use(session(sessionObj));
// SESSION SETTING END

// CORS START
app.use(cors({
    origin: `http://localhost:3000`,
    credentials: true,
}));
// CORS END

// PASSPORT SETTING START
const passport = pp.passport(app);

// 로컬 로그인 확인
app.post('/member/sign_in_confirm', 
    passport.authenticate('local', {
        successRedirect: '/member/sign_in_success', 
        failureRedirect: '/member/sign_in_fail', 
}));

/*
app.post('/member/sign_in_confirm', 
    async (req, res, next) => {

        try {
            let conn = await pool.getConnection(async conn => conn);
            let sql = `SELECT * FROM TBL_MEMBER WHERE M_ID = ?`;

            let [member] = await conn.query(sql, [req.body.m_id]);

            if (!member) {
                printLog(DAFAULT_NAME, '존재하지 않는 아이디입니다');
                return res.status(400).json({message: '존재하지 않는 아이디입니다'});
            }

            if (bcrypt.compareSync(req.body.m_pw, member.M_PW)) {

                const accessToken = jwt.sign(
                    {
                        m_id: member.M_ID,
                        m_name: member.M_NAME,
                        m_email: member.M_EMAIL,
                        m_phone: member.M_PHONE,
                        m_gender: member.M_GENDER,
                        m_self_introduction: member.M_SELF_INTRODUCTION,
                        m_profile_thumbnail: member.M_PROFILE_THUMBNAIL
                    },
                    DEV_PROD_VARIABLE.ACCESS_SECRET,
                    {
                        expiresIn: '30m'
                    }
                );

            } else {
                printLog(DAFAULT_NAME, '비밀번호 오류입니다.');
                return res.status(400).json({message: '비밀번호 오류입니다.'});
            }

        } catch (error) {
            
        }

        // let post = req.body;

        // console.log('m_id', post.m_id);
        // console.log('m_pw', post.m_pw);
        // console.log('req.body---', post);
        
        // let selectSql = `
        //     SELECT * FROM TBL_MEMBER WHERE M_ID = ?
        // `;

        // DB.query(selectSql, [req.body.m_id], (err, member) => {

        //     if (member.length <= 0) {
        //         console.log('존재하지 않는 아이디입니다');
        //         return res.status(404).json({message: '존재하지 않는 아이디입니다'});
        //     }
        //     if(bcrypt.compareSync(req.body.m_pw, member[0].M_PW)) {
        //         const accessToken = jwt.sign(
        //             {
        //                 m_id: member[0].M_ID,
        //                 m_name: member[0].M_NAME,
        //                 m_email: member[0].M_EMAIL,
        //                 m_phone: member[0].M_PHONE,
        //                 m_gender: member[0].M_GENDER
        //             },
        //             DEV_PROD_VARIABLE.ACCESS_SECRET,
        //             {
        //                 expiresIn: '30m'
        //             }
        //         );

        //         return res.status(200).cookie('access_token', accessToken, {httpOnly: true})

        //     } else {
        //         console.log('비밀번호가 일치하지 않습니다')
        //         return res.status(400).json({message: '비밀번호가 일치하지 않습니다'});
        //     }

        // });

    }
)
*/

// 구글 로그인 확인
app.get('/auth/google', 
    passport.authenticate('google', {
        scope: ['https://www.googleapis.com/auth/plus.login', 'email'] 
    }
));

// 구글 로그인 결과
app.get('/auth/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/member/sign_in_form' 
    }),
    function(req, res) {
        res.redirect('/');
});
// PASSPORT SETTING END

app.get('/', (req, res) => {
    printLog(DAFAULT_NAME, '/')

    // res.redirect('/member/get_member');

    res.send('hello jujube');
});


// ROUTER SETTING START
const memberRouter = require('./routes/memberRouter');
app.use('/member', memberRouter);

const storyRouter = require('./routes/storyRouter');
app.use('/story/story', storyRouter.storyRouter);
app.use('/story/reply', storyRouter.replyRouter);
// ROUTER SETTING END

app.listen(PORT);
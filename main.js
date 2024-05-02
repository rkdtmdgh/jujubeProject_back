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
app.use(cookieParser());

app.use(express.static('C:\\jujube\\upload\\profile_thums\\'));
app.use(express.static('C:\\jujube\\upload\\storyPictures\\'));

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
// app.post('/member/sign_in_confirm', 
//     passport.authenticate('local', {
//         successRedirect: '/member/sign_in_success', 
//         failureRedirect: '/member/sign_in_fail', 
// }));


app.post('/member/sign_in_confirm', 
    async (req, res, next) => {

        printLog(DEFAULT_NAME, '/member/sign_in_confirm');

        try {
            let conn = await pool.getConnection(async conn => conn);
            let sql = `SELECT * FROM TBL_MEMBER WHERE M_ID = ?`;

            let [member] = await conn.query(sql, [req.body.m_id]);

            console.log('member---', member);

            if (!member[0]) {
                printLog(DEFAULT_NAME, '존재하지 않는 아이디입니다');
                return res.json({message: '존재하지 않는 아이디입니다'});
            }

            if (bcrypt.compareSync(req.body.m_pw, member[0].M_PW)) {

                const accessToken = jwt.sign(
                    {
                        m_id: member[0].M_ID
                    },
                    DEV_PROD_VARIABLE.ACCESS_SECRET,
                    {
                        expiresIn: '5m',
                        issuer : 'About Tech',
                    }
                );

                const refreshToken = jwt.sign(
                    {
                        M_ID: member[0].M_ID,
                        M_NAME: member[0].M_NAME,
                        M_MAIL: member[0].M_MAIL,
                        M_PHONE: member[0].M_PHONE,
                        M_GENDER: member[0].M_GENDER,
                        M_SELF_INTRODUCTION: member[0].M_SELF_INTRODUCTION,
                        M_PROFILE_THUM: member[0].M_PROFILE_THUM,
                    },
                    DEV_PROD_VARIABLE.REFRESH_SECRET,
                    {
                        expiresIn: '30d',
                        issuer : 'About Tech',
                    }
                );

                return res.cookie('accessToken', accessToken).cookie('refreshToken', refreshToken).json({sessionID: accessToken});

            } else {
                printLog(DEFAULT_NAME, '비밀번호 오류입니다.');
                return res.cookie('accessToken', '').json({message: '비밀번호 오류입니다.'});
            }

        } catch (error) {
            printLog(DEFAULT_NAME, `/member/sign_in_confirm error`, error);
            next(error);
        }

    }
)



// 구글 로그인 확인
app.post('/auth/google', (req, res, next) => {
    printLog(DEFAULT_NAME, '/auth/google');

    const { token } = req.body;

    console.log('token', token);

    passport.authenticate('google', (err, user, info) => {
        printLog(DEFAULT_NAME, '/auth/google');
        if (err) {
            printLog(DEFAULT_NAME, `/auth/google error`, err);
            return res.json(null);
        } 

        if (!user) {
            printLog(DEFAULT_NAME, `/auth/google error`, info);
            return res.json(null);
        }

        console.log('user---', user);
        console.log('info---', info);

    })
});

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
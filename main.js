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

const DAFAULT_NAME = 'main';  
app.use(express.static('C:\\jujube\\upload\\profile_thums\\'));
app.use(express.static('C:\\jujube\\upload\\storyPictures\\'));


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
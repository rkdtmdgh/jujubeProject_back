const express = require('express');
const app = express();
const { PORT } = require('./lib/config/config');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const { printLog } = require('./lib/utils/logger');
const dotenv = require('dotenv');
const DEV_PROD_VARIABLE = require('./lib/config/config');

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
    origin: `http://localhost:${PORT}`,
    credentials: true,
}));
// CORS END

// PASSPORT SETTING START
let passport = require('./lib/passport/passport')(app);

// 로컬 로그인 확인
app.post('/member/signin_confirm', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/member/sign_in_form'
}));

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
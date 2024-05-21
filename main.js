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

let pp = require('./lib/passport/passport');

const DEV_PROD_VARIABLE = require('./lib/config/config');

const DEFAULT_NAME = '[main]';

app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}));  
app.use(compression());   
app.use(cookieParser());

const DAFAULT_NAME = 'main';  
app.use(express.static(`${DEV_PROD_VARIABLE.STORY_PICTURES_DIR}`));
app.use(express.static(`${DEV_PROD_VARIABLE.MEMBER_PROFILE_THUM_DIR}`));


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
    origin: [...DEV_PROD_VARIABLE.REACT_APP_HOST],
    credentials: true,
}));

// CORS END

// PASSPORT SETTING START
const passport = pp.passport(app);

// PASSPORT SETTING END

app.get('/', (req, res) => {
    printLog(DAFAULT_NAME, '/')

    // res.redirect('/member/get_member');

    res.send('hello jujube');
});


// ROUTER SETTING START
const memberRouter = require('./routes/memberRouter');
app.use('/member', memberRouter);

const authRouter = require('./routes/authRouter');
app.use('/auth', authRouter);

const storyRouter = require('./routes/storyRouter');
app.use('/story/story', storyRouter.storyRouter);
app.use('/story/reply', storyRouter.replyRouter);
// ROUTER SETTING END

app.listen(PORT, "0.0.0.0");
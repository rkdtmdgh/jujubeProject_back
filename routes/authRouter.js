const express = require('express');
const { printLog } = require('../lib/utils/logger');
const authService = require('../lib/service/authService');
const { authAcceccToken } = require('../lib/middleware/authorization');
const { verifyToken } = require('../lib/utils/jwt');
const router = express.Router();

const DEFAULT_NAME = 'authRouter';

router.get('/get_access_token', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/get_access_token');

    res.json({
        loginedMember: verifyToken(req.headers['authorization']).m_id
    });

})


module.exports = router;

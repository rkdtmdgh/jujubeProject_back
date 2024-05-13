const express = require('express');
const { printLog } = require('../lib/utils/logger');
const authService = require('../lib/service/authService');
const { authAcceccToken } = require('../lib/middleware/authorization');
const router = express.Router();

const DEFAULT_NAME = 'authRouter';

router.get('/get_access_token', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/get_access_token');

    res.json(1);

})


module.exports = router;

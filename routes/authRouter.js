const express = require('express');
const router = express.Router();

const DEFAULT_NAME = 'authRouter';

router.get = ('/get_access_token', (req, res) => {
    printLog(DEFAULT_NAME, '/get_access_token');

})

module.exports = router;
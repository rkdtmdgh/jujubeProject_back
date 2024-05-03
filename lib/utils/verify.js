const jwt = require('jsonwebtoken');
const { printLog } = require('./logger');
const DEV_PROD_VARIABLE = require("../config/config.js");

const verifyToken = (token) => {
    printLog('Verifying token');

    let result = jwt.verify(token, DEV_PROD_VARIABLE.ACCESS_SECRET)

    return result;

}

module.exports = {
    verifyToken
}
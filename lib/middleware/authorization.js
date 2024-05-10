const DEV_PROD_VARIABLE = require("../config/config");
const { printLog } = require("../utils/logger")
const jwt = require('jsonwebtoken');

// 엑세스 토큰 유효시간 확인.
const authAcceccToken = (req, res, next) => {
    printLog("authorization ", " authAcceccToken");

    let accessToken = req.cookies.accessToken;

    // let accessToken = req.headers['authorization'];

    console.log('accessToken---', accessToken);

    jwt.verify(accessToken, DEV_PROD_VARIABLE.ACCESS_SECRET, (err, access) => {

        if(err) {
            printLog("authAcceccToken 유효하지 않은 access 토큰", err);
            return res.json(null);
        }

        next();

    })

}

const getAccessToken = (req) => {
    printLog("authorization ", " getAccessToken");



}

module.exports = {
    authAcceccToken
};
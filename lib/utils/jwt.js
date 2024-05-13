const jwt = require('jsonwebtoken');
const { printLog } = require('./logger.js');
const DEV_PROD_VARIABLE = require("../config/config.js");

const DEFAULT_NAME = '[utils jwt]';

const verifyToken = (token) => {
    printLog(DEFAULT_NAME, 'Verifying token', token);

    let result = jwt.verify(token, DEV_PROD_VARIABLE.ACCESS_SECRET)

    return result;

}

const verifyRefreshToken = (token) => {
    printLog(DEFAULT_NAME, 'Verifying token', token);

    let result = jwt.verify(token, DEV_PROD_VARIABLE.REFRESH_SECRET)

    return result;

}

const makeAccessToken = (m_id) => {
    printLog(DEFAULT_NAME, 'Making access token');

    return jwt.sign(
        {
            m_id: m_id
        },
        DEV_PROD_VARIABLE.ACCESS_SECRET,
        {
            expiresIn: '30m',
            issuer : 'About Tech',
        }
    )

}

const makeRefreshToken = (member) => {
    printLog(DEFAULT_NAME, 'Making refresh token');

    return jwt.sign(
        {
            M_ID: member.M_ID,
            M_NAME: member.M_NAME,
            M_MAIL: member.M_MAIL,
            M_PHONE: member.M_PHONE,
            M_GENDER: member.M_GENDER,
            M_SELF_INTRODUCTION: member.M_SELF_INTRODUCTION,
            M_PROFILE_THUMBNAIL: member.M_PROFILE_THUMBNAIL,
        },
        DEV_PROD_VARIABLE.REFRESH_SECRET,
        {
            expiresIn: '30d',
            issuer : 'About Tech',
        }
    )

}

module.exports = {
    verifyToken,
    verifyRefreshToken,
    makeAccessToken,
    makeRefreshToken,
}
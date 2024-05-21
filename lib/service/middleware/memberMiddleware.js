const DB = require('../../db/DB');
const { verifyRefreshToken } = require('../../utils/jwt');
const { printLog } = require('../../utils/logger');

const DEFAULT_NAME = 'memberMiddleware';

const insertRefreshToken = (res, m_id, refreshToken, accessToken) => {
    printLog(DEFAULT_NAME, 'insertRefreshToken()');

    DB.query(`
        SELECT M_ID, TOKEN_EXP FROM TBL_TOKEN WHERE M_ID = ?
    `, [m_id], (err1, result) => {
    
        if(err1) {
            printLog(DEFAULT_NAME, `insertRefreshToken err1`, err1);
            return res.json(null);
            
        }

        if(result.length > 0) {

            let date = (new Date().getTime() + 1) / 1000;

            if(result[0].TOKEN_EXP <= date) {
                printLog(DEFAULT_NAME, `insertRefreshToken refreshToken expired`);

                DB.query(`
                    DELETE FROM TBL_TOKEN WHERE M_ID =?
                `, [m_id], (err2, result) => {

                    if(err2) {
                        printLog(DEFAULT_NAME, `insertRefreshToken refreshToken delete from tbl_token error`, err2);
                        return res.json(null);
                    }

                    if (result.affectedRows <= 0) {
                        printLog(DEFAULT_NAME, `insertRefreshToken refreshToken delete from tbl_token fail`);
                        return res.json(null);
                    }

                    insertTblToken(res, m_id, refreshToken, accessToken);

                })

            }

            return res.cookie('accessToken', accessToken)
                    .json({
                        result: 'success',
                        loginedMember: m_id,
                        message: '로그인에 성공했습니다.',
                    });

        }

        insertTblToken(res, m_id, refreshToken, accessToken);

    })

}

const insertTblToken = (res, m_id, refreshToken, accessToken) => {
    printLog(DEFAULT_NAME, 'insertTblToken()');

    let exp = verifyRefreshToken(refreshToken).exp;

    DB.query(`
        INSERT INTO 
            TBL_TOKEN(
                M_ID,
                TOKEN,
                TOKEN_EXP
            )
        VALUES(?, ?, ?)
    `, [m_id, refreshToken, exp], (err, result) => {

        if(err) {
            printLog(DEFAULT_NAME, `insertRefreshToken err`, err);
            res.json(null);
            return;
        }

        if (result.affectedRows <= 0) {
            printLog(DEFAULT_NAME, `/sign_in_confirm token insert fail error`);
            res.json(null);
        }

        return res.cookie('accessToken', accessToken)
                .json({
                    result: 'success',
                    loginedMember: m_id,
                    message: '로그인에 성공했습니다.',
                });

    })

}

const insertIsLogin = (m_id, accessToken) => {
    printLog(DEFAULT_NAME, 'insertIsLogin()');

    let insertSql = `
        INSERT INTO
            TBL_IS_LOGIN(
                M_ID,
                TOKEN,
            )
        VALUES(?, ?)
    `;

    DB.query(insertSql, [m_id, accesToken], (err, result) => {

        if(err) {
            printLog(DEFAULT_NAME, `insertIsLogin err`, err);
            return res.json(null);
        }

    });

}

module.exports = {
    insertRefreshToken
}
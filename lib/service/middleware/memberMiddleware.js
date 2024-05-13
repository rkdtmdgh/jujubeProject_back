const DB = require('../../db/DB');
const { printLog } = require('../../utils/logger');

const DEFAULT_NAME = 'memberMiddleware';

const insertRefreshToken = (res, m_id, refreshToken, accessToken) => {
    printLog(DEFAULT_NAME, 'insertRefreshToken()');

    DB.query(`
        SELECT M_ID FROM TBL_TOKEN WHERE M_ID = ?
    `, [m_id], (err1, result) => {
    
        if(err1) {
            printLog(DEFAULT_NAME, `insertRefreshToken err1`, err1);
            return res.json(null);
            
        }

        if(result.length > 0) {

            return res.cookie('accessToken', accessToken)
                    .json({
                        loginedMember: m_id,
                        message: '로그인에 성공했습니다.',
                    });

        } else {

            DB.query(`
                INSERT INTO 
                    TBL_TOKEN(
                        M_ID,
                        TOKEN
                    )
                VALUES(?, ?)
            `, [m_id, refreshToken], (err2, result) => {
    
                if(err2) {
                    printLog(DEFAULT_NAME, `insertRefreshToken err2`, err2);
                    res.json(null);
                    return;
                }
    
                if (result.affectedRows <= 0) {
                    printLog(DEFAULT_NAME, `/sign_in_confirm token insert fail error`);
                    res.json(null);
                }

                return res.cookie('accessToken', accessToken)
                        .json({
                            loginedMember: m_id,
                            message: '로그인에 성공했습니다.',
                        });

            })
        }

    })

}

module.exports = {
    insertRefreshToken
}
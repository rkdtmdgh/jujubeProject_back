const { makeAccessToken, verifyToken } = require("../utils/jwt");
const { printLog } = require("../utils/logger");

const DEFAULT_NAME = 'authService';

const authService = {

    getAccessToken: (req, res) => {
        printLog(DEFAULT_NAME, 'getAccessToken()')

        let m_id = verifyToken(req.headers['Authorization']).m_id;

        let accessToken = makeAccessToken(m_id);

        res.cookie('accessToken', accessToken)
            .json({
                sessionID: accessToken,
                loginedMember: m_id,
            })

    }

}

module.exports = authService;
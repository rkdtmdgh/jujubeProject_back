const DB = require("../db/DB");
const bcrypt = require('bcrypt');
const { printLog } = require("../utils/logger");
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const DEV_PROD_VARIABLE = require("../config/config");

const DEFAULT_NAME = '[memberService]';

const memberService = {

    sign_up_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'sign_up_confirm');

        let post = req.body;

        let sql = `
            INSERT INTO
                TBL_MEMBER(
                    M_ID,
                    M_PW,
                    M_NAME,
                    M_MAIL,
                    M_PHONE,
                    M_GENDER
                    ${ post.m_self_introduction !== undefined ? `, M_SELF_INTRODUCTION` : `` }
                    ${ req.file !== undefined ? `, M_PROFILE_THUMBNAIL` : `` }
            ) 
            values(?, ?, ?, ?, ?, ?
                ${ post.m_self_introduction !== undefined ? `, ?` : `` }
                ${ req.file !== undefined ? `, ?` : `` }
            )
        `;

        let state = [post.m_id, bcrypt.hashSync(post.m_pw, 10), post.m_name, post.m_mail, post.m_phone, post.m_gender];

        if(post.m_self_introduction !== undefined) state.push(post.m_self_introduction);
        if(req.file !== undefined) state.push(req.file.filename);

        DB.query(sql, state, (err, result) => {

            if (err) {
                res.json(null);
                return;
            }

            if (result.affectedRows > 0) {
                res.json(result.affectedRows)

            } else {
                res.json(result.affectedRows)

            }

        })

    },

    sign_in_success: (req, res) => {
        printLog(DEFAULT_NAME, 'sign_in_success');

        res.json({
            sessionID: req.sessionID,
        });

    },

    sign_in_fail: (req, res) => {
        printLog(DEFAULT_NAME, 'sign_in_fail');

        res.json(null);

    },

    get_member: async function(req, res) {
        printLog(DEFAULT_NAME, 'get_member');

        try {

            const { accessToken } = req.cookies;
            if (!accessToken) return res.status(403).json(-1);

            let m_id = 'hooka';
    
            let connection = await pool.getConnection(async conn => conn);
    
            let selectSql = `
                SELECT * FROM TBL_MEMBER WHERE M_ID = ?
            `;
            
            try {
                
                let [getMember] = await connection.query(selectSql, [m_id]);
    
                res.json({
                    member: getMember[0]
                })
    
            } catch (error) {
                printLog(DEFAULT_NAME, 'get member error', error)
                res.json(null);
                
            } finally {
                connection.release();
            }

        } catch (error) {
            res.clearCooke('accessToken');
            return res.state(403).json(null);
        }

    },

    get_search_member: (req, res) => {
        printLog(DEFAULT_NAME, 'get_search_member');

        DB.query(`
            SELECT * FROM TBL_MEMBER WHERE M_ID LIKE ? ORDER BY M_ID ASC 
        `, [`%${req.query.search_member}%`], (err, members) => {

            if(err) {
                printLog(DEFAULT_NAME, 'get search member err', err);
                res.json(null);
            } else {
                printLog(DEFAULT_NAME, 'get search member result', members);
                res.json(members);
            }

        })

    },

    modify_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'modify_confirm');

        const { accessToken } = req.cookies;
        if (!accessToken) return res.status(403).json(-1);

        let post = req.body;

        let sql = `
            UPDATE 
                TBL_MEMBER
            SET 
                M_NAME = ?,
                M_MAIL = ?,
                M_PHONE = ?,
                M_GENDER = ?
                ${ post.m_self_introduction !== undefined ? `, M_SELF_INTRODUCTION = ?` : `` }
                ${ req.file !== undefined ? `, M_PROFILE_THUMBNAIL = ?` : `` }
            WHERE 
                M_ID = ?
        `;

        let state = [post.m_name, post.m_mail, post.m_phone, post.m_gender];

        if(post.m_self_introduction !== undefined) state.push(post.m_self_introduction);
        if(req.file !== undefined) state.push(req.file.filename);

        state.push(req.user);

        DB.query(sql, state, (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'modify confirm err', err);
                res.json(null);

            } else {
                res.json({result: result.changedRows})

            }

        })

    },

    sign_out_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'sign_out_confirm');

        try {
            res.cookie('accessToken', '');
            res.status(200).json(1);
        } catch (error) {
            res.status(500).json(null);
        }

    },

    delete_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'delete_confirm');

        const { accessToken } = req.cookies;
        if (!accessToken) return res.status(403).json(-1);

        DB.query(`
            UPDATE 
                TBL_MEMBER 
            SET 
                M_IS_DELETED = 1,
                M_DELETED_DATE = NOW()
            WHERE 
                M_ID = ?
        `, [], (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'delete confirm err', err);
                res.json(null)

            } else {

                res.json({ result: result.changedRows });

            }

        })

    },

    friend_request: (req, res) => {
        printLog(DEFAULT_NAME, 'friend_request');

        const { accessToken } = req.cookies;
        if (!accessToken) return res.status(403).json(-1);

        let post = {
            fr_req_id: 'hooka',
            fr_res_id: 'gilong',
            fr_ilchon_name: '후카친구'
        }

        DB.query(`
            SELECT * FROM 
                TBL_FRIEND_REQUEST 
            WHERE 
                FR_REQ_ID = ?
            AND
                FR_RES_ID = ?
        `, [post.fr_req_id, post.fr_res_id], (err1, cnt) => {

            if(err1) {
                printLog(DEFAULT_NAME, 'friend_request err1', err1);
                res.json(null)

            } else {
                // 이미 친구신청 한경우. result = 3
                if(cnt.length > 0) {

                    res.json({ result: 3 });

                // 친구 신청 안한 경우 새로 신청
                } else {

                    DB.query(`
                        INSERT INTO
                            TBL_FRIEND_REQUEST(
                                FR_REQ_ID,
                                FR_RES_ID,
                                FR_ILCHON_NAME
                            )
                        VALUES(?, ?, ?)
                    `, [post.fr_req_id, post.fr_res_id, post.fr_ilchon_name], (err, result) => {
            
                        if (err) {
                            printLog(DEFAULT_NAME, 'friend request err', err);
                            res.json(null);
            
                        // 신청 완료. 제대로 등록 시 result = 1, 실패 시 result = 0
                        } else {
                            res.json({ result: result.affectedRows })
            
                        }
            
                    })

                }

            }

        })

    },

    friend_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'friend_confirm');

        const { accessToken } = req.cookies;
        if (!accessToken) return res.status(403).json(-1);

        let post = req.body;

        // 로그인 user의 친구 목록에 친구 추가
        DB.query(`
            INSERT INTO 
                TBL_FRIEND(
                    F_OWNER_ID,
                    F_ID,
                    F_ILCHON_NAME,
                )
            VALUES(?, ?, ?)
        `, [req.user, post.f_id, post.f_ilchon_name], (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'friend confirm err', err);
                res.json(null)

            } else {

                //  로그인 user의 친구 목록에 일촌 친구 추가 성공 시 반대의 경우 추가.(일촌 친구 목록에 로그인 user 추가)
                if (result.affectedRows > 0) {

                    DB.query(`
                    INSERT INTO 
                        TBL_FRIEND(
                            F_OWNER_ID,
                            F_ID,
                            F_ILCHON_NAME
                        )
                    VALUES(?, ?, ?)
                    `, [post.f_id, req.user, '일촌명'], (err2, result2) => {

                        if(err2) {
                            printLog(DEFAULT_NAME, 'friend confirm err2', err2);
                            res.json(null)

                        } else {

                            res.json({ result: result2.affectedRows })

                        }

                    })

                } else {

                    res.json({ result: result.affectedRows })

                }

            }

        })


    },

    friend_delete_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'friend_delete_confirm');

        const { accessToken } = req.cookies;
        if (!accessToken) return res.status(403).json(-1);

        let post = req.body;

        DB.query(`
            DELETE FROM 
                TBL_FRIEND 
            WHERE 
                F_OWNER_ID = ? 
            AND 
                F_ID = ? 
        `, [req.user, post.f_id], (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'friend_delete_confirm err', err);
                res.json(null)

            } else {

                if(result.affectedRows > 0) {

                    DB.query(`
                        DELETE FROM 
                            TBL_FRIEND 
                        WHERE 
                            F_OWNER_ID = ? 
                        AND 
                            F_ID = ? 
                    `, [post.f_id, req.user], (err2, result) => {

                        if(err) {
                            printLog(DEFAULT_NAME, 'friend_delete_confirm err2', err2);
                            res.json(null)
            
                        } else {

                            res.json({ result: result.affectedRows })

                        }

                    })

                } else {

                    res.json({ result: result.affectedRows })

                }

            }

        })

    },

}

module.exports = memberService;
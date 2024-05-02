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

    /*
    sign_in_confirm: async (req, res) => {
        printLog(DEFAULT_NAME, 'sign_in_confirm');

        try {
            let conn = await pool.getConnection(async conn => conn);
            let sql = `SELECT * FROM TBL_MEMBER WHERE M_ID = ?`;

            let [member] = await conn.query(sql, [req.body.m_id]);

            console.log('member---', member);

            if (!member[0]) {
                printLog(DEFAULT_NAME, '존재하지 않는 아이디입니다');
                return res.status(400).json({message: '존재하지 않는 아이디입니다'});
            }

            if (bcrypt.compareSync(req.body.m_pw, member[0].M_PW)) {

                const accessToken = jwt.sign(
                    {
                        m_id: member[0].M_ID
                    },
                    DEV_PROD_VARIABLE.ACCESS_SECRET,
                    {
                        expiresIn: '1m',
                        issuer : 'About Tech',
                    }
                );

                return res.status(200).cookie('accessToken', accessToken).json({message: '로그인 성공'});

            } else {
                printLog(DEFAULT_NAME, '비밀번호 오류입니다.');
                return res.status(400).cookie('accessToken', '').json({message: '비밀번호 오류입니다.'});
            }

        } catch (error) {
            printLog(DEFAULT_NAME, `/member/sign_in_confirm error`, error);
            res.state(500).json(null);
        }

    },
    */


    sign_in_success: (req, res) => {
        printLog(DEFAULT_NAME, 'sign_in_success');

        res.json({
            sessionID: req.sessionID,
            loginedMember: req.user
        });

    },

    sign_in_fail: (req, res) => {
        printLog(DEFAULT_NAME, 'sign_in_fail');

        res.json(null);

    },

    get_member: async function(req, res) {
        printLog(DEFAULT_NAME, 'get_member');

        if(req.user === undefined) {
            return res.state(400).json(-1);
        }

        try {

            let connection = await pool.getConnection(async conn => conn);
    
            let selectSql = `
                SELECT * FROM TBL_MEMBER WHERE M_ID = ?
            `;
            
            let [getMember] = await connection.query(selectSql, [req.user]);

            res.json({
                member: getMember[0]
            })

        } catch (error) {
            printLog(DEFAULT_NAME, 'get member error', error)
            return res.state(403).json(null);
        } finally {
            connection.release();
        }

    },

    get_search_member: (req, res) => {
        printLog(DEFAULT_NAME, 'get_search_member');

        if(req.user === undefined) {
            return res.state(400).json(-1);
        }

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

        if(req.user === undefined) {
            return res.state(400).json(-1);
        }

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

        req.session.destroy();
        req.json(null);

    },

    delete_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'delete_confirm');

        if(req.user === undefined) {
            return res.state(400).json(-1);
        }

        DB.query(`
            UPDATE 
                TBL_MEMBER 
            SET 
                M_IS_DELETED = 1,
                M_DELETED_DATE = NOW()
            WHERE 
                M_ID = ?
        `, [req.user], (err, result) => {

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

        if(req.user === undefined) {
            return res.state(400).json(-1);
        }

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
        `, [req.user, post.fr_res_id], (err1, cnt) => {

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
                    `, [req.user, post.fr_res_id, post.fr_ilchon_name], (err, result) => {
            
                        if (err) {
                            printLog(DEFAULT_NAME, 'friend request err', err);
                            res.json(null);
            
                        // 신청 완료. 제대로 등록 시 result = 1, 실패 시 result = 0
                        } else {
                            printLog(DEFAULT_NAME, 'friend request result', result);
                            res.json({ result: result.affectedRows })
            
                        }
            
                    })

                }

            }

        })

    },

    friend_confirm: async (req, res) => {
        printLog(DEFAULT_NAME, 'friend_confirm');

        if(req.user === undefined) {
            return res.state(400).json(-1);
        }

        let post = req.body;

        let conn1 = await pool.getConnection(async conn => conn);
        let conn2 = await pool.getConnection(async conn => conn);

        let sql1 = `
            INSERT INTO 
                TBL_FRIEND(
                    F_OWNER_ID,
                    F_ID,
                    F_ILCHON_NAME,
                )
            VALUES(?, ?, ?)
        `;

        let sql2 = `
            INSERT INTO 
                TBL_FRIEND(
                    F_OWNER_ID,
                    F_ID,
                    F_ILCHON_NAME,
                )
            VALUES(?, ?, ?)
        `;

        conn1.beginTransaction();
        conn2.beginTransaction();

        try {

            // 로그인 user의 친구 목록에 수락한 친구 추가.
            let [result1] = await conn1.query(sql1, [req.user, ``, ``]);

            // 친구 추가 성공 시.
            if (result1.affectedRows > 0) {
                
                try {

                    // 반대의 경우. 수락한 친구의 친구 목록에 로그인 user 추가.
                    let [result2] = await conn2.query(sql2, [``, res.user, ``]);

                    // 양쪽 친구 록에 친구 추가 성공 시.
                    if (result2.affectedRows > 0) {
                        conn1.commit();
                        conn2.commit();
                        res.json({
                            result: result2.affectedRows
                        });

                    // result2 실패 시 result1이랑 둘 다 rollback
                    } else {
                        conn1.rollback();
                        conn2.rollback();
                        res.json({
                            result: result2.affectedRows
                        });
                    }

                } catch (error2) {
                    printLog(DEFAULT_NAME, 'friend confirm error', error2)
                    conn1.rollback();
                    conn2.rollback();
                    res.json(null);
                }

            } else {
                printLog(DEFAULT_NAME, 'friend confirm fail', result1.affectedRows);
                conn1.rollback();
                res.json({
                    result: result1.affectedRows
                });
            }

        } catch (error) {
            printLog(DEFAULT_NAME, 'friend confirm error', error);
            conn1.rollback();
            conn2.rollback();
            res.json(null);

        } finally {
            conn1.release();
            conn2.release();

        }

    },

    friend_delete_confirm: async (req, res) => {
        printLog(DEFAULT_NAME, 'friend_delete_confirm');

        if(req.user === undefined) {
            return res.state(400).json(-1);
        }

        let post = req.body;

        let conn1 = await pool.getConnection(async conn => conn);
        let conn2 = await pool.getConnection(async conn => conn);

        let sql1 = `
            DELETE FROM 
                TBL_FRIEND 
            WHERE 
                F_OWNER_ID = ? 
            AND 
                F_ID = ? 
        `;

        let sql2 = `
            DELETE FROM 
                TBL_FRIEND 
            WHERE 
                F_OWNER_ID = ? 
            AND 
                F_ID = ?
        `;

        conn1.beginTransaction();
        conn2.beginTransaction();

        try {

            let [result1] = await conn1.query(sql1, []);

            if(result1.affectedRows > 0) {

            }

        } catch (error) {
            printLog(DEFAULT_NAME, 'friend_delete_confirm error', error);
            res.json(null);
        } finally {
            conn1.release();
            conn2.release();
        }
    

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
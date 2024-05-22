const DB = require("../db/DB");
const bcrypt = require('bcrypt');
const { printLog } = require("../utils/logger");
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const shortid = require('shortid');
const fs = require('fs');

/* 사용자 ip 가져오기
const os = require('os');
const nets = os.networkInterfaces();
const results = Object.create(null);

for (const name of Object.keys(nets)) {
	for (const net of nets[name]) {
		if (net.family === "IPv4" && !net.internal) {
			if (!results[name]) {
				results["IP"] = net.address;
			}
		}
	}
}
*/

const DEV_PROD_VARIABLE = require("../config/config");
const { verifyToken, makeAccessToken, makeRefreshToken } = require("../utils/jwt");
const { insertRefreshToken } = require("./middleware/memberMiddleware");

const DEFAULT_NAME = '[memberService]';

const memberService = {

    sign_up_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'sign_up_confirm');

        let post = req.body;

        let memberInsertSql = `
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

        DB.query(memberInsertSql, state, (err, result) => {

            if (err) {
                console.log(DEFAULT_NAME, 'sign up confirm err', err);

                if(req.file !== undefined) {
                    fs.unlink(`${DEV_PROD_VARIABLE.MEMBER_PROFILE_THUM_DIR}${post.m_id}\\${req.file.filename}`, (err1) => {
                        if(err1) {
                            printLog(DEFAULT_NAME,'sign up confirm fs.unlink err1', err1);
                        }
                        printLog(DEFAULT_NAME,'sign up confirm fs.unlink success');
                    })
                    res.json(null);
                    return;

                }
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

    sign_in_confirm: async (req, res) => {
        printLog(DEFAULT_NAME, 'sign_in_confirm');

        let conn = await pool.getConnection(async conn => conn);
        try {

            let sql = `SELECT * FROM TBL_MEMBER WHERE M_ID = ? AND M_IS_DELETED = 0`;

            let [member] = await conn.query(sql, [req.body.m_id]);

            if (!member[0]) {
                printLog(DEFAULT_NAME, '존재하지 않는 아이디입니다');
                return res.json({
                    result: -2,
                    message: '존재하지 않는 아이디입니다'
                });
            }

            if (Number(member[0].M_IS_SUSPEND) === 1) {
                printLog(DEFAULT_NAME, '계정 정지된 사용자입니다.');
                return res.json({
                    result: -3,
                    message: '사용 정지된 ID입니다.'
                })
            }

            if (bcrypt.compareSync(req.body.m_pw, member[0].M_PW)) {

                const accessToken = makeAccessToken(member[0].M_ID);
                const refreshToken = makeRefreshToken(member[0])

                insertRefreshToken(res, req.body.m_id, refreshToken, accessToken);

            } else {
                printLog(DEFAULT_NAME, '비밀번호 오류입니다.');
                return res.json({
                            result: -4,
                            message: '비밀번호 오류입니다.'
                        });
            }

        } catch (error) {
            printLog(DEFAULT_NAME, `/sign_in_confirm error`, error);
            res.json(null);
        } finally {
            conn.release();
        }

    },

    google_sign_in_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'google_sign_in_confirm');

        let post = req.body.decoded;

        DB.query(`
                SELECT * FROM TBL_MEMBER WHERE M_GOOGLE_ID = ?
            `, [post.sub], (err0, g_member) => {

                if (err0) {
                    printLog(DEFAULT_NAME, 'google login find M_GOOGLE_ID err0', err0)
                    return res.json(null);

                } 

                // post.sub 값과 일치하는 구글 계정이 있는 경우
                if (g_member.length > 0) {

                    // 계정 정지 상태
                    if (Number(g_member[0].M_IS_SUSPEND) === 1) {
                        printLog(DEFAULT_NAME, '계정 정지된 사용자입니다.');
                        return res.json({
                            result: -3, 
                        });

                    } 

                    if(Number(g_member[0].M_IS_DELETED) === 1) {
                        printLog(DEFAULT_NAME, '이미 탈퇴한 사용자입니다.');
                        return res.json({
                            result: -5,
                        });
                    }

                    // 정상 이용자
                    printLog(DEFAULT_NAME, '구글 로그인에 성공했습니다.');

                    const accessToken = makeAccessToken(g_member[0].M_ID);
                    const refreshToken = makeRefreshToken(g_member[0]);

                    insertRefreshToken(res, g_member[0].M_ID, refreshToken, accessToken);

                    
                } else {

                    // 구글 아이디로 가입된 계정이 없는 경우

                    // g-mail 과 같은 m-mail 있는지 검색
                    DB.query(`
                        SELECT * FROM TBL_MEMBER WHERE M_MAIL = ? AND M_IS_DELETED = 0
                    `, [post.email], (err, member) => {

                        if(err) {
                            printLog(DEFAULT_NAME, 'google login err', err);
                            return res.json(null);

                        } 
        
                        // m_mail이 google mail과 일치하는 경우
                        if(member.length > 0) {

                            // 일치하는 mail이 있지만 계정 정지된 경우
                            if (Number(member[0].M_IS_SUSPEND) === 1) {
                                printLog(DEFAULT_NAME, '계정 정지된 사용자입니다.');
                                return res.json({
                                    result: -3, 
                                });

                            } 
                            
                            // mail이 일치하는 하고 계정이 정지 안된 경우
                            // m_goolge_id 컬럼에 post.sub 값 입력
                            DB.query(`
                                UPDATE 
                                    TBL_MEMBER
                                SET 
                                    M_GOOGLE_ID = ?
                                WHERE
                                    M_NO = ?
                            `, [post.sub, member[0].M_NO], (err2, result) => {
    
                                if(err2) {
                                    printLog(DEFAULT_NAME, 'goolge login err2', err2)
                                    return res.json(null);
                                    
                                } 
                                
                                if(result.affectedRows > 0) {

                                    printLog(DEFAULT_NAME, '구글 로그인에 성공했습니다.');
    
                                    const accessToken = makeAccessToken(member[0].M_ID);
                                    const refreshToken = makeRefreshToken(member[0]);
                    
                                    insertRefreshToken(res, member[0].M_ID, refreshToken, accessToken);

                                }

                            })

                        // google mail과 일치하는 mail이 없는 경우
                        } else {

                            // shortid를 이용해 id, pw 생성 후 DB 입력.
                            let id = shortid();
                            let pw = shortid();

                            DB.query(`
                                INSERT INTO
                                    TBL_MEMBER(
                                        M_ID,
                                        M_PW,
                                        M_NAME,
                                        M_MAIL,
                                        M_PHONE,
                                        M_GOOGLE_ID
                                    )
                                VALUES(?, ?, ?, ?, ?, ?)
                            `, [id, bcrypt.hashSync(pw, 10), post.name, post.email, '--', post.sub], (err3, result) => {

                                if(err3) {
                                    printLog(DEFAULT_NAME, 'google login err3', err3);
                                    res.json(null);

                                } else {
                                    DB.query(`
                                        SELECT * FROM TBL_MEMBER WHERE M_ID = ?
                                    `, [id], (err4, insert_member) => {

                                        if(err4) {
                                            printLog(DEFAULT_NAME, 'google login err4', err4);
                                            res.json(null);
                                        } else {

                                            printLog(DEFAULT_NAME, '구글 로그인에 성공했습니다.');

                                            const accessToken = makeAccessToken(insert_member[0].M_ID);
                                            const refreshToken = makeRefreshToken(insert_member[0]);

                                            insertRefreshToken(res, insert_member[0].M_ID, refreshToken, accessToken);

                                        }

                                    })

                                }

                            })

                        }

                    })

                }

            })

    },

    get_member: (req, res) => {
        printLog(DEFAULT_NAME, 'get_member');

        let m_id = verifyToken(req.headers['authorization']).m_id;

        DB.query(`
            SELECT 
                M_ID, 
                M_NAME, 
                M_MAIL, 
                M_PHONE, 
                M_GENDER, 
                M_SELF_INTRODUCTION, 
                M_PROFILE_THUMBNAIL 
            FROM 
                TBL_MEMBER 
            WHERE 
                M_ID = ?
        `, [m_id], (err, member) => {

            if(err) {
                printLog(DEFAULT_NAME, 'get_member err', err);
                res.json(null);
            } else {
                printLog(DEFAULT_NAME, 'get_member result', member);

                res.json({
                        member: member[0],
                    });

                }

        })

        /*
        try {
            
            let accessToken =  req.cookies.accessToken;
            let refreshToken = req.cookies.refreshToken;
    
            jwt.verify(accessToken, DEV_PROD_VARIABLE.ACCESS_SECRET, (err, access) => {
    
                if(err) {
                    printLog(DEFAULT_NAME, 'get_member 유효하지 않은 access 토큰', err);
                    res.json(-1);

                } else {
                    printLog(DEFAULT_NAME, 'get_member 유효한 access 토큰', access);
                    
                    jwt.verify(refreshToken, DEV_PROD_VARIABLE.REFRESH_SECRET, (err, refresh) => {

                        if (err) { 
                            printLog(DEFAULT_NAME, 'get_member 유효하지 않은 refresh 토큰', err);
                            res.json(-1);

                        } else {
                            printLog(DEFAULT_NAME, 'get_member 유효한 refresh 토큰', refresh);

                            accessToken = makeAccessToken(refresh.M_ID);

                            DB.query(`
                                SELECT 
                                    M_ID, 
                                    M_NAME, 
                                    M_MAIL, 
                                    M_PHONE, 
                                    M_GENDER, 
                                    M_SELF_INTRODUCTION, 
                                    M_PROFILE_THUMBNAIL 
                                FROM 
                                    TBL_MEMBER 
                                WHERE 
                                    M_ID = ?
                            `, [refresh.M_ID], (err, member) => {

                                if(err) {
                                    printLog(DEFAULT_NAME, 'get_member err', err);
                                    res.json(-1);
                                } else {
                                    printLog(DEFAULT_NAME, 'get_member result', member);

                                    res.cookie('accessToken', accessToken)
                                        .json({
                                            sessionID: accessToken,
                                            member: member[0],
                                        });

                                    }

                            })

                        }

                    })

                }

            })

        } catch (error) {
            printLog(DEFAULT_NAME, 'get_member error', error)
            res.json(null);
        }
        */

    },

    get_search_member: async function(req, res) {
        printLog(DEFAULT_NAME, 'get_search_member');

        let m_id = verifyToken(req.headers['authorization']).m_id;

        let conn1 = await pool.getConnection(async conn => conn);

        let sql1 = `
            SELECT 
                M_ID, 
                M_NAME, 
                M_SELF_INTRODUCTION,
                M_PROFILE_THUMBNAIL 
            FROM 
                TBL_MEMBER 
            WHERE 
                M_IS_DELETED = 0 
            AND 
                M_IS_SUSPEND = 0 
            AND 
                M_ID LIKE ? 
            ORDER BY M_ID ASC
        `;

        let sql2 = `
            SELECT F_NO, F_ILCHON_NAME FROM TBL_FRIEND WHERE F_OWNER_ID = ? AND F_ID = ?
        `;

        try {
            let [sltMembers] = await conn1.query(sql1, [`%${req.query.search_member}%`]);

            try {

                for(let i = 0; i < sltMembers.length; i++) {

                    let [result] = await conn1.query(sql2, [m_id, sltMembers[i].M_ID]);

                    if (result.length <= 0) {
                        sltMembers[i].result = 0;
                    } else {
                        sltMembers[i].result = 1;
                        sltMembers[i].F_ILCHON_NAME = result[0].F_ILCHON_NAME;
                    }

                }

                printLog(DEFAULT_NAME, 'get search member result', sltMembers);
                res.json(sltMembers);

            } catch (error) {
                printLog(DEFAULT_NAME, 'get search member sql2 err', error);
            }

        } catch (error) {
            printLog(DEFAULT_NAME, 'get search member sql1 err', error);
        } finally {
            conn1.release();
        }

    },

    /*
    get_search_member: (req, res) => {
        printLog(DEFAULT_NAME, 'get_search_member');

        let m_id = verifyToken(req.cookies.accessToken).M_ID;

        DB.query(`
            SELECT M_ID, M_NAME, M_PROFILE_THUMBNAIL FROM TBL_MEMBER WHERE M_IS_DELETED = 0 AND M_IS_SUSPEND = 0 AND M_ID LIKE ? ORDER BY M_ID ASC 
        `, [`%${req.query.search_member}%`], (err, sltMembers) => {
            
            let members = sltMembers;

            printLog(DEFAULT_NAME, 'get_search_member members', members);

            if(err) {
                printLog(DEFAULT_NAME, 'get search member err', err);
                res.json(null);
            } else {

                for(let i = 0; i < sltMembers.length; i++) {

                    DB.query(`
                        SELECT FR_NO FROM TBL_FRIEND_REQUEST WHERE FR_REQ_ID = ? AND FR_RES_ID = ?
                    `, [m_id, sltMembers[i].M_ID], (err1, result) => {

                        if(err1) {
                            printLog(DEFAULT_NAME, 'get search member err1', err1);
                            return res.json(null);
                        }

                        if (result.length <= 0) {
                            members[i].result = 0;
                        } else {
                            members[i].result = 1;
                        }

                    })

                }

                printLog(DEFAULT_NAME, 'get search member result2', members);
                res.json(members);
            }

        })

    },
    */

    modify_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'modify_confirm');

        let post = req.body;

        let updateSql = `
            UPDATE 
                TBL_MEMBER
            SET 
                M_NAME = ?,
                M_MAIL = ?,
                M_PHONE = ?,
                M_GENDER = ?,
                M_MOD_DATE = NOW()
                ${ post.m_self_introduction !== undefined ? `, M_SELF_INTRODUCTION = ?` : `` }
                ${ req.file !== undefined ? `, M_PROFILE_THUMBNAIL = ?` : `` }
            WHERE 
                M_ID = ?
        `;

        let state = [post.m_name, post.m_mail, post.m_phone, post.m_gender];

        if(post.m_self_introduction !== undefined) state.push(post.m_self_introduction);
        if(req.file !== undefined) state.push(req.file.filename);

        state.push(post.m_id);

        DB.query(`
            SELECT M_PROFILE_THUMBNAIL FROM TBL_MEMBER WHERE M_ID = ?
        `, [post.m_id], (err0, member) => {
            
            if (err0) {
                printLog(DEFAULT_NAME,'modify confirm err0', err0);
                return res.json(null);
            }

            if (req.file !== undefined) {

                fs.unlink(`${DEV_PROD_VARIABLE.MEMBER_PROFILE_THUM_DIR}${post.m_id}\\${member[0].M_PROFILE_THUMBNAIL}`, (err) => {
                    if(err) {
                        printLog(DEFAULT_NAME,'modify confirm fs.unlink err', err);
                        return
                    }
                })

            }

        })

        DB.query(updateSql, state, (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'modify confirm err', err);
                res.json(null);

            } else {

                DB.query(`
                    SELECT * FROM TBL_MEMBER WHERE M_ID = ?
                `, [post.m_id], (err2, member) => {

                    if(err2) {
                        printLog(DEFAULT_NAME,'modify confirm err2', err2);
                        return res.json(null);
                    }

                    const refreshToken = makeRefreshToken(member[0]);

                    DB.query(`
                        UPDATE TBL_TOKEN SET TOKEN = ? WHERE M_ID = ?
                    `, [refreshToken, post.m_id], (err3, result) => {

                        if (err) {
                            printLog(DEFAULT_NAME,'modify confirm err3', err3);
                            return res.json(null);
                        }
                        
                        res.json({result: result.changedRows});

                    })

                    // DB.query(`
                    //     SELECT M_ID FROM TBL_TOKEN WHERE M_ID = ?
                    // `, [post.m_id], (err3, sltToken) => {
                        
                    //     if (err) {
                    //         printLog(DEFAULT_NAME, 'modify refresh token insert db err3', err3);
                    //         return res.json(null);
                    //     }

                    //     if (sltToken.length <= 0) {

                    //         DB.query(`
                    //             INSERT INTO 
                    //                 TBL_TOKEN 
                    //             SET 
                    //                 M_ID = ?,
                    //                 TOKEN = ?
                    //         `, [post.m_id, refreshToken], (err4, tokenResult) => {

                    //             if (err4) {
                    //                 printLog(DEFAULT_NAME,'modify refresh token insert db err4', err4);
                    //                 return res.json(null);
                    //             }

                    //             if (tokenResult.length <= 0) return res.json(null);
                    //             else res.json({result: result.changedRows})

                    //         });

                    //     }

                    //     res.json({result: result.changedRows})

                    // })

                })

            }

        })

    },

    sign_out_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'sign_out_confirm');

        res.json(null);

    },

    delete_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'delete_confirm');

        let m_id = verifyToken(req.cookies.accessToken).m_id;

        DB.query(`
            UPDATE 
                TBL_MEMBER 
            SET 
                M_IS_DELETED = 1,
                M_DELETED_DATE = NOW(),
                M_MOD_DATE = NOW()
            WHERE 
                M_ID = ? 
        `, [m_id], (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'delete confirm err', err);
                res.json(null)

            } else {

                res.json({ result: result.changedRows });

            }

        })

    },

    // 친구 요청 유무 확인.
    friend_request_status: (req, res) => {
        printLog(DEFAULT_NAME, 'friend_request_status');

        let m_id = verifyToken(req.headers['authorization']).m_id;
        let post = req.body;

        DB.query(`
            SELECT FR_NO FROM TBL_FRIEND_REQUEST WHERE FR_REQ_ID = ? AND FR_RES_ID = ?
        `, [m_id, post.fr_res_id], (err, result) => {
            
            if(err) {
                printLog(DEFAULT_NAME, 'friend_request_status err', err);
                return res.json(null);
            }

            // 친구 요청 이력 있으면 result = 1, 없으면 result = 0
            if (result.length <= 0) {
                res.json({ result: 0 });
            } else {
                res.json({ result: 1 });
            }
        })

    },

    friend_request: (req, res) => {
        printLog(DEFAULT_NAME, 'friend_request');

        let m_id = verifyToken(req.headers['authorization']).m_id;

        // WHERE NOT EXISTS 이후 부분 없을 시 INSERT 
        // let insertSql = `
        // INSERT INTO 
        //     TBL_FRIEND_REQUEST (
        //         FR_REQ_ID, 
        //         FR_RES_ID, 
        //         FR_ILCHON_NAME
        //     )
        // SELECT ?, ?, ?
        // WHERE NOT EXISTS (
        // SELECT 1 FROM TBL_FRIEND_REQUEST WHERE FR_REQ_ID = '?' AND FR_RES_ID = '?'
        // );
        // `;

        DB.query(`
            SELECT * FROM 
                TBL_FRIEND_REQUEST 
            WHERE 
                FR_REQ_ID = ?
            AND
                FR_RES_ID = ?
            AND 
                FR_IS_ACCEPT = 0
        `, [m_id, req.body.fr_res_id], (err1, cnt) => {

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
                    `, [m_id, req.body.fr_res_id, req.body.fr_ilchon_name], (err, result) => {
            
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

    // 내가 한 친구 요청 취소
    friend_request_cancle: (req, res) => {
        printLog(DEFAULT_NAME, 'friend_request_cancle');

        let m_id = verifyToken(req.headers['authorization']).m_id;

        DB.query(`
            DELETE FROM 
                TBL_FRIEND_REQUEST 
            WHERE 
                FR_REQ_ID = ?
            AND
                FR_RES_ID = ?
        `, [m_id, req.body.f_id], (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'friend request cancle err', err);
                return res.json(null);
            }

            if (result.affectedRows <= 0) {
                printLog(DEFAULT_NAME, 'friend request cancle failed');
                return res.json(null);
            }

            res.json({ result: result.affectedRows });

        })

    },

    // 내가 받은 친구 요청 거절
    friend_request_reject: (req, res) => {
        printLog(DEFAULT_NAME, 'friend_request_reject');

        let m_id = verifyToken(req.headers['authorization']).m_id;

        DB.query(`
            DELETE FROM 
                TBL_FRIEND_REQUEST 
            WHERE 
                FR_REQ_ID = ?
            AND
                FR_RES_ID = ?
        `, [req.body.f_id, m_id], (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'friend_request_reject error', err)
                return res.json(null)
            }

            if (result.affectedRows <= 0) {
                printLog(DEFAULT_NAME, 'friend_request_reject failed');
                return res.json(null);
            }
            
            res.json({ result: result.affectedRows });

        });

    },

    // 친구 추가 수락 컨펌 => try구문 안에서 한번에 모든 트랜잭션 처리하게 수정하였음.
    friend_request_confirm: async (req, res) => {
        printLog(DEFAULT_NAME, 'friend_request_confirm', req.body);

        let m_id = verifyToken(req.headers['authorization']).m_id;         // 로그인 된 아이디 (친구신청을 받는 ID)

        let post = req.body;

        let conn = await pool.getConnection(async conn => conn);

        let insertFriendSql = `
            INSERT INTO 
                TBL_FRIEND(
                    F_OWNER_ID,
                    F_ID,
                    F_ILCHON_NAME
                )
            VALUES
                (?, ?, ?), 
                (?, ?, ?)
        `;
        let updateFriendRequestSql = `
            UPDATE 
                TBL_FRIEND_REQUEST 
            SET 
                FR_IS_ACCEPT = 1, 
                FR_MOD_DATE = NOW() 
            WHERE 
                (FR_REQ_ID = ? AND FR_RES_ID = ?)
            OR
                (FR_REQ_ID = ? AND FR_RES_ID = ?)
        `;

        conn.beginTransaction()

        try {

            let [insertResult] = await conn.query(insertFriendSql, [m_id, post.f_id, post.f_request_ilchon_name, post.f_id, m_id, post.f_response_ilchon_name]);

            if (insertResult.affectedRows > 0) {
                let [updateResult] = await conn.query(updateFriendRequestSql, [post.f_id, m_id, m_id, post.f_id]);

                if (updateResult.affectedRows > 0) {
                    printLog(DEFAULT_NAME, 'friend_request_confirm 친구추가 성공!');
                    conn.commit();
                    res.json({ result: 1 });
                } else {
                    printLog(DEFAULT_NAME, 'friend_request_confirm 친구추가 실패!');
                    conn.rollback();
                    res.json({ result: 0 });
                }

            } else {
                conn.rollback();
                res.json({ result: 0 });
            }

        } catch (error) {
            printLog(DEFAULT_NAME, 'friend_request_confirm insertFriendSql error', error);
            conn.rollback();
        } finally {
            conn.release();
        }

    },

    friend_delete_confirm: async (req, res) => {
        printLog(DEFAULT_NAME, 'friend_delete_confirm');

        let m_id = verifyToken(req.headers['authorization']).m_id;
        let f_id = req.body.f_id;

        let conn = await pool.getConnection(async conn => conn);

        let deleteFriendSql = `
            DELETE FROM 
                TBL_FRIEND 
            WHERE 
                (F_OWNER_ID = ? AND F_ID = ?)
            OR 
                (F_OWNER_ID = ? AND F_ID = ?)
        `;

        try {
            let [result] = await conn.query(deleteFriendSql, [m_id, f_id, f_id, m_id]);

            res.json({
                result: result.affectedRows
            });

        } catch (error) {
            printLog(DEFAULT_NAME, 'friend_delete_confirm friend_delete_confirm error', error);
        } finally {
            conn.release();
        }

    },

    get_friend_count: (req, res) => {
        printLog(DEFAULT_NAME, 'get_friend_count');

        // let token = req.cookies.accessToken;
        // let m_id=  verifyToken(token).m_id;
        // let m_id = verifyToken(req.headers['authorization']).m_id;
        let id = req.query.id;

        sql = `
            SELECT 
                COUNT(*) AS FRIEND_COUNT 
            FROM 
                TBL_FRIEND 
            WHERE 
                F_OWNER_ID = ? 
        `;

        DB.query(sql, [id], (err, friend_cnt) => {

            if(err) {
                printLog(DEFAULT_NAME, 'get_friend_count err', err);
                return res.json(null);
            }

            res.json({
                friend_count: friend_cnt[0].FRIEND_COUNT
            });

        })

    },

    get_friend_list: async function (req, res) {
        printLog(DEFAULT_NAME, 'get_friend_list');

        let m_id = verifyToken(req.headers['authorization']).m_id;

        let conn = await pool.getConnection(async conn => conn);

        let selectFriendListSql = `
            SELECT 
                F.F_OWNER_ID,
                F.F_ID,
                F.F_ILCHON_NAME,
                M.M_ID,
                M.M_NAME,
                M.M_MAIL, 
                M.M_PHONE, 
                M.M_GENDER, 
                M.M_SELF_INTRODUCTION, 
                M.M_PROFILE_THUMBNAIL
            FROM 
                TBL_FRIEND F
            LEFT JOIN 
                TBL_MEMBER M
            ON 
                F.F_ID = M.M_ID
            WHERE
                F.F_OWNER_ID = ?
            AND 
                F_IS_BLOCK = 0
        `;

        try {
            let [friend_list] = await conn.query(selectFriendListSql, [m_id]);
            res.json({friend_list : friend_list})

        } catch (error) {
            printLog(DEFAULT_NAME, 'get_friend_list selectFriendListSql error', error);
            res.json(null)
        } finally {
            conn.release();
        }

    },

    // 친구 신청 목록 가져오기 (나에게 들어온 신청(friend_response_list)과 내가 한 신청(friend_request_list))
    get_friend_request_list: async function (req, res) {
        printLog(DEFAULT_NAME, 'get_friend_request_list()');

        let m_id = verifyToken(req.headers['authorization']).m_id;

        let conn = await pool.getConnection(async conn => conn);

        let selectFriendRequestListSql = `
            SELECT 
                FR.FR_REQ_ID,
                FR.FR_RES_ID,
                M.M_PROFILE_THUMBNAIL,
                FR_ILCHON_NAME
            FROM 
                TBL_FRIEND_REQUEST FR
            LEFT JOIN 
                TBL_MEMBER M
            ON 
                FR.FR_RES_ID = M.M_ID 
            WHERE 
                FR.FR_REQ_ID = ? 
            AND 
                FR.FR_IS_ACCEPT = 0
            `;
        let selectFriendResponseListSql = `
            SELECT 
                FR.FR_RES_ID,
                FR.FR_REQ_ID,
                M.M_PROFILE_THUMBNAIL,
                FR_ILCHON_NAME
            FROM 
                TBL_FRIEND_REQUEST FR
            LEFT JOIN 
                TBL_MEMBER M
            ON 
                FR.FR_REQ_ID = M.M_ID 
            WHERE 
                FR.FR_RES_ID = ? 
            AND 
                FR.FR_IS_ACCEPT = 0
            `;

        try {
            let [friend_request_list] = await conn.query(selectFriendRequestListSql, m_id);
            let [friend_response_list] = await conn.query(selectFriendResponseListSql, m_id);

            res.json({
                friend_request_list: friend_request_list,
                friend_response_list: friend_response_list,
                messge: 'friend_request_list: 내가 요청한 친구 신청 목록, friend_response_list: 내가 받은 친구 신청 목록'
            })

        } catch (error) {
            printLog(DEFAULT_NAME, 'get_friend_request_list selectFriendRequestListSql error', error);
            return res.json(null)
        } finally {
            conn.release();
        }

    },

    get_friend_status: (req, res) => {
        printLog(DEFAULT_NAME, 'get_friend_status()');

        let m_id = verifyToken(req.headers['authorization']).m_id;

        let post = req.body;    // f_id 친구 아이디

        // 친구 유무 확인
        DB.query(`
            SELECT 
                F_NO 
            FROM 
                TBL_FRIEND 
            WHERE 
                F_OWNER_ID = ? 
            AND 
                F_ID = ? 
        `, [m_id, post.f_id], (err, result) => {

            if(err) {
                printLog(DEFAULT_NAME, 'get_friend_status err', err);
                return res.json(null);
            }

            // 친구인 경우
            if (result.length > 0) {
                res.json({
                    is_friend: true,
                    is_friend_request: false
                })
            } else {

                DB.query(`
                    SELECT
                        FR_NO
                    FROM
                        TBL_FRIEND_REQUEST
                    WHERE 
                        FR_REQ_ID = ? 
                    AND
                        FR_RES_ID = ?
                    AND 
                        FR_IS_ACCEPT = 0
                `, [m_id, post.f_id], (err2, result2) => {

                    if(err2) {
                        printLog(DEFAULT_NAME, 'get_friend_status err2', err2);
                        return res.json(null);
                    }

                    // 친구는 아닌데 친구 요청한 경우
                    if(result2.length > 0) {
                        res.json({
                            is_friend: false,
                            is_friend_request: true
                        })

                    // 친구도 아니고 친구 요청도 안한 경우
                    } else {
                        res.json({
                            is_friend: false,
                            is_friend_request: false
                        })
                    }

                })

            }

        })

    },

}

module.exports = memberService;
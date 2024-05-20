const DB = require('../db/DB');
const pool = require('../db/pool');
const { printLog } = require('../utils/logger');

const DEFAULT_NAME = 'replyService';


const replyService = {

    // 댓글 작성 컨펌 (LIMIT 사용해서 DB.query사용) => (트랜잭션, insertId 이용해서도 한번 해보기)
    /*
    reply_write_confirm: (req, res) => {

        let post = req.body;

        console.log('post: ', post);

        let sql1 = `SELECT R_NO FROM TBL_REPLY ORDER BY R_NO DESC LIMIT 1`;     // 제일 마지막에 작성 된 댓글의 no 가져오기!
        let sql2 = `INSERT INTO TBL_REPLY(R_ORIGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES (?, ?, ?, ?)`;   // 서브 쿼리로 해보는 방식도 있다!

        DB.query(sql1, [], (error1, r_no) => {
            if (error1) {
                console.log('error1: ', error1);
                res.json(null);

            } else {

                console.log('r_no:' , r_no);

                DB.query(sql2, [Number(r_no[0].R_NO + 1), post.s_no, post.r_txt, post.m_id], (error2, result) => {
                    if (error2) {
                        console.log('error2: ', error2);
                        res.json(null);

                    } else {
                        res.json(result.affectedRows);

                    }

                })

            }

        })

    },
    */

    // 댓글 작성 컨펌 (insertId 이용) => (트랜젝션은 락걸려 있어 불가능!!)
    // 기존코드
    /*
    reply_write_confirm: (req, res) => {      
        printLog(DEFAULT_NAME, 'reply_write_confirm');

        let post = req.body;

        console.log('post: ', post);

        let sql1 = `INSERT INTO 
                        TBL_REPLY(
                                R_ORIGIN_NO, 
                                R_OWNER_STORY_NO, 
                                R_TXT, 
                                R_M_ID) 
                        VALUES(0, ?, ?, ?)`;
        let sql2 = `UPDATE 
                        TBL_REPLY 
                    SET 
                        R_ORIGIN_NO = ? 
                    WHERE 
                        R_NO = ?`;

        DB.query(sql1, [post.s_no, post.r_txt, post.m_id], (error1, result) => {
            if (error1) {
                console.log('error1: ', error1);
                res.json(null);

            } else {

                DB.query(sql2, [Number(result.insertId), Number(result.insertId)], (error2, result) => {
                    if (error2) {
                        console.log('error2: ', error2);
                        res.json(null);

                    } else {
                        res.json(result.affectedRows);

                    }

                })

            }

        })

    },
    */

    // 댓글 작성 컨펌 (트랜젝션 이용 => 단일커넥션 이용! insertId 이용 !! 
    // insertId나 LIMIT같이 DB를 여러번 왔다갔다 해아 하는 경우는 잘 사용하지 않고 UUID로 unique값을 만들어서 INSERT 해 주는 방법을 많이 씀)
    reply_write_confirm: async function (req, res) {      
        printLog(DEFAULT_NAME, 'reply_write_confirm');

        let post = req.body;

        let connection =  await pool.getConnection(async conn => conn); // 효율적으로 연결관리 하는 방법 알아보기. pool

        let insertReply = `INSERT INTO 
                        TBL_REPLY(
                                R_ORIGIN_NO, 
                                R_OWNER_STORY_NO, 
                                R_TXT, 
                                R_M_ID) 
                        VALUES(0, ?, ?, ?)`;                            // REPLY 테이블에 댓글 INSERT
        let insertROriginNo = `UPDATE 
                        TBL_REPLY 
                    SET 
                        R_ORIGIN_NO = ? 
                    WHERE 
                        R_NO = ?`;                                      // 기본 댓글일 경우 R_ORIGIN_NO를 R_NO와 맞춰주는 쿼리

        try {

            let write1 = await connection.query(insertReply, [post.s_no, post.r_txt, post.m_id]);

            if (write1[0].affectedRows > 0) {

                let write2 = await connection.query(insertROriginNo, [Number(write1[0].insertId), Number(write1[0].insertId)]);

                if (write2[0].affectedRows > 0) {
                    await connection.commit();
                    return res.json(write2[0].affectedRows);

                } else {
                    await connection.rollback();
                    return res.json(null);

                }

            } else {
                await connection.rollback();
                return res.json(null);

            }

        } catch (error) {
            await connection.rollback();
            console.log('error:', error);
            return res.json(null);

        } finally {
            await connection.release();

        }

    },

    // 대댓글 작성 컨펌
    re_reply_write_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 're_reply_write_confirm');

        let post = req.body;
        
        let insertReReply = `INSERT INTO 
                            TBL_REPLY(
                                        R_ORIGIN_NO, 
                                        R_OWNER_STORY_NO, 
                                        R_CLASS, 
                                        R_TXT, 
                                        R_M_ID) 
                            VALUES (?, ?, 1, ?, ?)`;                                // 대댓글 INSERT

        DB.query(insertReReply, [post.r_origin_no, post.s_no, post.r_txt, post.m_id], (error, result) => {
            if (error) {
                console.log('error: ', error);
                return res.json(null);

            } else {
                return res.json(result.affectedRows);

            }

        })
        
    },

    // 스토리에 대한 모든 댓글 가져오기
    get_replys : (req, res) => {
        printLog(DEFAULT_NAME, 'get_replys');
        
        let s_no = req.query.s_no;

        let getReplys = `SELECT TBL_REPLY.*, TBL_MEMBER.M_PROFILE_THUMBNAIL 
                            FROM 
                                TBL_REPLY 
                            JOIN 
                                TBL_MEMBER 
                                ON TBL_REPLY.R_M_ID = TBL_MEMBER.M_ID 
                            WHERE 
                                TBL_REPLY.R_OWNER_STORY_NO = ? 
                                AND R_CLASS = 0 
                                AND R_IS_DELETED = 0 
                            ORDER BY TBL_REPLY.R_REG_DATE DESC`;                            // 스토리에 달린 모든 댓글 가져오기 + 멤버 썸네일 JOIN TABKE 해서 가져왔음.
        let getReReplyCnt = `SELECT COUNT(*) 
                            FROM 
                                TBL_REPLY 
                            WHERE R_ORIGIN_NO = ? 
                            AND R_CLASS = 1 
                            AND R_IS_DELETED = 0`;                                          // 댓글에 달린 대댓글 갯수 가져오기

        DB.query(getReplys, [s_no], (error1, replys) => {
            if (error1) {
                console.log('error1', error1);
                return res.json(null);

            } else {

                let completedQueries = 0;

                if (replys.length === 0) {
                    return res.json('');

                }

                for (let i = 0; i < replys.length; i++) {
                    DB.query(getReReplyCnt, [replys[i].R_NO], (error2, re_replys) => {
                        
                        if (error2) {
                            console.log('error2', error2);
                            return res.json(null);

                        } else {
                            replys[i].re_replysCnt = re_replys[0]['COUNT(*)'];
                            completedQueries++;

                            if (completedQueries === replys.length) {
                                return res.json(replys);
                                
                            }

                        }

                    })

                }

            }

        })

    },

    // 댓글 한개에 대한 대댓글 가져오기
    get_re_replys : (req, res) => {
        printLog(DEFAULT_NAME, 'get_re_replys');

        let r_no = req.query.r_no;

        let getReReplys = `SELECT TBL_REPLY.*, TBL_MEMBER.M_PROFILE_THUMBNAIL 
        FROM TBL_REPLY 
        JOIN TBL_MEMBER ON TBL_REPLY.R_M_ID = TBL_MEMBER.M_ID 
        WHERE TBL_REPLY.R_ORIGIN_NO = ? AND R_CLASS = 1 AND R_IS_DELETED = 0  
        ORDER BY TBL_REPLY.R_REG_DATE DESC`;                                        // R_ORIGIN_NO 기준으로 모든 대댓글 가져오기(멤버 썸네일 JOIN 해서 가져왔음)

        DB.query(getReReplys, [r_no], (error1, re_replys) => {
            if (error1) {
                console.log('error1', error1);
                return res.json(null);

            } else {
                return res.json(re_replys);

            }

        })

    },

    // 댓글 수정 컨펌
    modify_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'modify_confirm');
        
        let post = req.body;

        let updateReply = `UPDATE 
                        TBL_REPLY 
                    SET 
                        R_TXT = ?, 
                        R_MOD_DATE = NOW() 
                    WHERE 
                        R_NO = ?`;                                          // 댓글 modify

        DB.query(updateReply, [post.r_txt, post.r_no], (error, result) => {
            if (error) {
                console.log('error: ', error);
                return res.json(null);

            } else {
                return res.json(result.affectedRows);

            }

        }) 

    },

    // 댓글 삭제 컨펌
    delete_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'delete_confirm');

        let post = req.body;

        let deleteReply = `UPDATE 
                        TBL_REPLY 
                    SET 
                        R_IS_DELETED = 1, 
                        R_DELETED_DATE = NOW() 
                    WHERE 
                        R_ORIGIN_NO = ?`;                       // 댓글 삭제처리
        let deleteReReply = `UPDATE 
                        TBL_REPLY 
                    SET 
                        R_IS_DELETED = 1, 
                        R_DELETED_DATE = NOW() 
                    WHERE 
                        R_NO = ?`;                              // 대댓글 삭제처리

        switch (post.r_class) {

            case 0 :

                DB.query(deleteReply, [post.r_no], (error, result) => {
                    if (error) {
                        console.log('error: ', error);
                        return res.json(null);
        
                    } else {
                        return res.json(result.affectedRows);
        
                    }
        
                });

            break;

            case 1 :

                DB.query(deleteReReply, [post.r_no], (error, result) => {
                    if (error) {
                        console.log('error: ', error);
                        return res.json(null);
                        
                    } else {
                        return res.json(result.affectedRows);
                        
                    }

                })

            break;

            default: 
                res.json(null);

        }

    },

}

module.exports = replyService;
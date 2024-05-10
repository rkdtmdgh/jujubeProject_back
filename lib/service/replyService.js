const DB = require('../db/DB');
const pool = require('../db/pool');


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
    
    reply_write_confirm: (req, res) => {                            // inserId 이용 (트랜젝션은 락걸려 있어 불가능!!)

        let post = req.body;

        let sql1 = `INSERT INTO TBL_REPLY(R_ORIGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(0, ?, ?, ?)`;
        let sql2 = `UPDATE TBL_REPLY SET R_ORIGIN_NO = ?  WHERE R_NO = ?`;

        DB.query(sql1, [post.s_no, post.r_txt, post.m_id], (error1, result) => {
            if (error1) {
                console.log('error1: ', error1);
                res.json(null);

            } else {

                console.log('insertId: ', result.insertId);

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

    // 대댓글 작성 컨펌
    re_reply_write_confirm: (req, res) => {

        let post = req.body;
        
        console.log('post: ', post);

        let sql1 = `INSERT INTO TBL_REPLY(R_ORIGIN_NO, R_OWNER_STORY_NO, R_CLASS, R_TXT, R_M_ID) VALUES (?, ?, ?, ?, ?)`;

        DB.query(sql1, [post.r_origin_no, post.s_no, 1, post.r_txt, post.m_id], (error, result) => {
            if (error) {
                console.log('error: ', error);
                res.json(null);

            } else {
                res.json(result.affectedRows);

            }

        })
          
    },

    // 스토리에 대한 모든 댓글 가져오기
    get_replys : (req, res) => {
        
        let s_no = req.query.s_no;
        // let s_no = 16;

        let sql1 = `SELECT TBL_REPLY.*, TBL_MEMBER.M_PROFILE_THUMBNAIL
        FROM TBL_REPLY
        JOIN TBL_MEMBER ON TBL_REPLY.R_M_ID = TBL_MEMBER.M_ID
        WHERE TBL_REPLY.R_OWNER_STORY_NO = ? AND R_CLASS = 0 AND R_IS_DELETED = 0 
        ORDER BY TBL_REPLY.R_REG_DATE DESC`;
        let sql2 = `SELECT COUNT(*) FROM TBL_REPLY WHERE R_ORIGIN_NO = ? AND R_CLASS = 1 AND R_IS_DELETED = 0`;

        DB.query(sql1, [s_no], (error1, replys) => {
            if (error1) {
                console.log('error1', error1);
                res.json(null);

            } else {

                let completedQueries = 0;

                if (replys.length === 0) {
                    res.json('');

                }

                for (let i = 0; i < replys.length; i++) {
                    DB.query(sql2, [replys[i].R_NO], (error2, re_replys) => {
                        
                        if (error2) {
                            console.log('error2', error2);
                            res.json(null);

                        } else {
                            replys[i].re_replysCnt = re_replys[0]['COUNT(*)'];
                            completedQueries++;

                            if (completedQueries === replys.length) {
                                res.json(replys);
                                
                            }

                        }

                    })

                }

            }

        })

    },

    // 댓글 한개에 대한 대댓글 가져오기
    get_re_replys : (req, res) => {

        let r_no = req.query.r_no;
        // let r_no = 3;

        let sql1 = `SELECT TBL_REPLY.*, TBL_MEMBER.M_PROFILE_THUMBNAIL 
        FROM TBL_REPLY 
        JOIN TBL_MEMBER ON TBL_REPLY.R_M_ID = TBL_MEMBER.M_ID 
        WHERE TBL_REPLY.R_ORIGIN_NO = ? AND R_CLASS = 1 AND R_IS_DELETED = 0  
        ORDER BY TBL_REPLY.R_REG_DATE DESC`;

        DB.query(sql1, [r_no], (error1, re_replys) => {
            if (error1) {
                console.log('error1', error1);
                res.json(null);

            } else {
                res.json(re_replys);

            }

        })

    },

    // 댓글 수정 컨펌
    modify_confirm: (req, res) => {
        
        let post = req.body;

        let sql1 = `UPDATE TBL_REPLY SET R_TXT = ?, R_MOD_DATE = NOW() WHERE R_NO = ?`

        DB.query(sql1, [post.r_txt, post.r_no], (error, result) => {
            if (error) {
                console.log('error: ', error);
                res.json(null);

            } else {
                res.json(result.affectedRows);

            }

        }) 
           

    },

    // 댓글 삭제 컨펌
    delete_confirm: (req, res) => {

        let r_no = req.body.r_no;

        let sql1 = `UPDATE TBL_REPLY SET R_IS_DELETED = 1, R_DELETED_DATE = NOW() WHERE R_NO = ?`;

        DB.query(sql1, [r_no], (error, result) => {
            if (error) {
                console.log('error: ', error);
                res.json(null);

            } else {
                res.json(result.affectedRows);

            }

        })

    },

}

module.exports = replyService;
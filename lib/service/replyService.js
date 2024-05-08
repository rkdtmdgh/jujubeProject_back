const DB = require('../db/DB');
const pool = require('../db/pool');


const replyService = {

    // 댓글 작성 컨펌 (트랜잭션 사용)
    reply_write_confirm: async function(req, res) {

        // let post = req.body;
        let post = {
            'r_owner_story_no' : 15,
            'r_txt' : 'reply_write_test_txt',
            'r_m_id' : 'reply_write_test_id',
        }

        let connection1 = await pool.getConnection();
        let connection2 = await pool.getConnection();

        let sql1 = `INSERT INTO TBL_REPLY(R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES (?, ?, ?)`
        let sql2 = `UPDATE TBL_REPLY SET R_ORGIN_NO = ? WHERE R_NO = ?`

        connection1.beginTransaction();
        connection2.beginTransaction();

        try {

            let write1 = await connection1.query(sql1, [post.r_owner_story_no, post.r_txt, post.r_m_id]);

            console.log('write1: ', write1);

            if (write1[0].affectedRows > 0) {

                try {

                    console.log('write1 success!!');
                    console.log('write1[0].insertId: ', write1[0].insertId);

                    let write2 = await connection2.query(sql2, [write1[0].insertId, write1[0].insertId]);
                    console.log('write2: ', write2);

                    if (write2[0].affectedRows > 0) {
                        connection1.commit();
                        connection2.commit();

                    } else {
                        connection1.rollback();
                        connection2.rollback();
                        res.json(null);

                    }

                } catch (error2) {
                    console.log('error2', error2);
                    connection1.rollback();
                    connection2.rollback();
                    res.json(null);

                } 
                res.json(write1[0].affectedRows);
                
            }
            

        } catch (error1) {
            console.log('error1', error1);
            connection1.rollback();
            connection2.rollback();
            res.json(null);

        } finally {
            connection1.release();
            connection2.release();

        }


    },

    // 스토리에 대한 댓글 가져오기
    get_replys : (req, res) => {
        
        let s_no = req.query.s_no;
        // let s_no = 16;

        let sql1 = `SELECT TBL_REPLY.*, TBL_MEMBER.M_PROFILE_THUMBNAIL
        FROM TBL_REPLY
        JOIN TBL_MEMBER ON TBL_REPLY.R_M_ID = TBL_MEMBER.M_ID
        WHERE TBL_REPLY.R_OWNER_STORY_NO = ? AND R_CLASS = 0 
        ORDER BY TBL_REPLY.R_REG_DATE DESC`;
        let sql2 = `SELECT COUNT(*) FROM TBL_REPLY WHERE R_ORGIN_NO = ? AND R_CLASS = 1`;

        DB.query(sql1, [s_no], (error1, replys) => {
            if (error1) {
                console.log('error1', error1);
                res.json(null);

            } else {
                let completedQueries = 0;

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
        WHERE TBL_REPLY.R_ORGIN_NO = ? AND R_CLASS = 1 
        ORDER BY TBL_REPLY.R_REG_DATE DESC`;

        DB.query(sql1, [r_no], (error1, re_replys) => {
            if (error1) {
                console.log('error1', error1);
                res.json(null);

            } else {
                console.log('re_replys: ', re_replys);
                res.json(re_replys);

            }

        })


    },

    modifyConfirm: (req, res) => {
        
        let post = req.body

        DB.query(`
            UPDATE 
                TBL_REPLY 
            SET 
                R_TXT = ?, 
                R_MOD_DATE = NOW() 
            WHERE 
                R_NO = ?
            `,
            ['modify_test', 2],
            (error, result) => {
            
                if (error) {
                    res.send('reply modify fail!!');
                    
                } else {
                    res.send('reply modify success!!');

                }

        });

    },

    /*
    deleteConfirm: (req, res) => {

        DB.query(
            `
                DELETE FROM 
                    TBL_REPLY 
                WHERE 
                    T_NO = ?
            `,
            [2],
            (error, result) => {

                if (error) {


                } else {


                }

            }
        )


    },
    */



    


}

module.exports = replyService;
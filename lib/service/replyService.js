const DB = require('../db/DB');


const replyService = {

    // 댓글 작성 컨펌
    writeConfirm: (req, res) => {

        // if (req.user === undefined) 
        // res.json(-1);

        // let post = req.body;

        DB.query(
            `
                INSERT INTO 
                    TBL_REPLY(
                        R_OWNER_STORY_NO, 
                        R_TXT, 
                        R_M_ID) 
                VALUES (?, ?, ?)
            `,
            [1, '2312312', 'gildong'],
            (error, result) => {
                if (error) {
                    res.send('reply write confirm fail!!')

                } else {
                    
                    DB.query(`
                        UPDATE 
                            TBL_REPLY 
                        SET 
                            R_ORIGIN_NO = ? 
                        WHERE 
                            R_NO = ?
                    `,
                    [result.insertId, result.insertId],
                    (error, result) => {
                        
                        if (error) {
                            res.send('reply write confirm fail!!')

                        } else {
                            res.send('reply write confirm success!!')

                        }

                    })
                    

                }

            }
        )
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
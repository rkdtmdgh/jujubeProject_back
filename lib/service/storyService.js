const DB = require('../db/DB');
const pool = require('../db/pool');


const storyService = {

    // 스토리 작성 컨펌
    writeConfirm: async function(req, res) {

        let m_id = 'test.m_id';         // req.user
        let post = 'test.post';         // req.body.s_text
        // console.log('req.file', req.file);
        // let s_owner_no = result.insertId;
        let story_fileNames = ['123', '456', '789'];    // req.file ? req.file.filenames : null;

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);

        let sql1 = `INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES(?, ?, ?)`;
        let sql2 = `INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(?, ?)`;

        connection1.beginTransaction();
        connection2.beginTransaction();

        try {

            let write1 = await connection1.query(sql1, [m_id, post, 0]);
            
            if (write1[0].affectedRows > 0) {

                try {

                    for (i = 0; i < story_fileNames.length; i++) {

                    let write2 = await connection2.query(sql2, [write1[0].insertId, story_fileNames[i]]);
                    
                    if (write2[0].affectedRows > 0) {
                        connection1.commit();
                        connection2.commit();
                    } else {
                        connection1.rollback();
                        connection2.rollback();
                    }
                    
                }
                } catch (error2) {
                    res.json('error2');

                }

        } else {
            connection1.rollback();
            connection2.rollback();

        }
        
        res.json('success');
        
        } catch (error) {
            console.log('error', error);
            connection1.rollback();
            res.json('error');

        } finally {
            connection1.release();
            connection2.release();

        }

    },


    // 나 + 친구들의 모든 스토리 가져오기(홈 => 피드에 보이는 것)
    getAllStorys: async function(req, res) {

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);
        let connection3 = await pool.getConnection(async conn => conn);

        let m_id = 'gildong';

        let sql1 = `SELECT F_ID FROM TBL_FRIEND WHERE F_OWNER_ID = ? AND F_IS_BLOCK = 0`;
        let sql2 = `SELECT * FROM TBL_STORY WHERE S_OWNER_ID = ?`;
        
        connection1.beginTransaction();
        connection2.beginTransaction();
        connection3.beginTransaction();

        try {

            let [getAllStorys1] = await connection1.query(sql1, [m_id]);
            console.log('getAllStorys1: ', getAllStorys1);
            console.log('getAllStorys1.length: ', getAllStorys1.length);

            if (getAllStorys1.length > 0) {
                
                let getAllStorys2Result = [];

                for (let i = 0; i < getAllStorys1.length; i++) {

                    try {
                        let [getAllStorys2] = await connection2.query(sql2, getAllStorys1[i].F_ID);
                        getAllStorys2Result.push(getAllStorys2);

                        if (getAllStorys2 !== undefined && getAllStorys2.length > 0) {
                            connection1.commit();
                            connection2.commit();
                            connection3.commit();

                        } else {
                            connection1.rollback();
                            connection2.rollback();
                            connection3.rollback();

                        } 
                        
                    } catch (error2) {
                        connection1.rollback();
                        connection2.rollback();
                        connection3.rollback();
                        
                    } finally {
                        connection1.release();
                        connection2.release();
                        connection3.release();
                    }
                    
                }
                
                try {

                    let [getAllStorys3] = await connection3.query(sql2, [m_id]);
                    console.log('getAllStorys3: ', getAllStorys3);
                    getAllStorys2Result.push(getAllStorys3);

                } catch (error3) {
                    connection1.rollback();
                    connection2.rollback();
                    connection3.rollback();

                }

                res.json(getAllStorys2Result);

            }
                    
        } catch (error) {
            connection1.rollback();
            connection2.rollback();
            connection3.rollback();

        } finally {
            connection1.release();
            connection2.release();
            connection3.release();

        }

    },

    // 내 모든 스토리 가져오기 (내 피드에서 보이는 것)
    getMyAllStorys: async function(req, res) {




    },

    // 스토리 한개 가져오기 (피드에서 스토리 클릭 시)
      getStory: async function(req, res) {


        

      },
    
    // 스토리 수정 컨펌 
    modifyConfirm: (req, res) => {

        // if (req.user === undefined) 
        // res.json(-1);
        
        let post = 'test.modify_post';         // req.body
        let s_no = 3;
        // console.log('req.file', req.file);
        let story_fileNames = ['999', '888', '777'];    // req.file ? req.file.filenames : null;

        if (story_fileNames && story_fileNames.length > 0) {

            DB.query(
                `
                    UPDATE 
                        TBL_STORY 
                    SET 
                        S_TXT = ?, 
                        S_IS_PUBLIC = ?, 
                        S_MOD_DATE = NOW() 
                    WHERE 
                        S_NO = ?
                `,
                [post, 1, s_no],
                (error, result) => {
    
                    if (error) {
                        res.json(null);
    
                    } else {
                     
                        DB.query(
                            `
                                DELETE FROM 
                                    TBL_STORY_PICTURE 
                                WHERE 
                                    SP_OWNER_NO = ?
                            `,
                            [s_no],
                            (error, result) => {
                                
                                if (error) {
                                    res.json(null);

                                } else {

                                    for (i = 0; i < story_fileNames.length; i++) {
                                        DB.query(
                                            `
                                                INSERT INTO 
                                                    TBL_STORY_PICTURE(
                                                        SP_OWNER_NO, 
                                                        SP_PICTURE_NAME
                                                    ) 
                                                VALUES(?, ?)
                                            `,
                                            [s_no, story_fileNames[i]],
                                            (error, result) => {
                    
                                                if (error) {
                                                    res.json(null);
                                                    
                                                } else {
                                                    res.json(result.affectedRows);
                    
                                                }
                    
                                            }
                                        )
                                        }

                                }
            
                            }
                        )
    
                    }});

        } else {
            DB.query(
                `
                    UPDATE 
                        TBL_STORY 
                    SET 
                        S_TXT = ?, 
                        S_IS_PUBLIC = ?, 
                        S_MOD_DATE = NOW() 
                    WHERE 
                        S_NO = ?
                `,
                [post, 1, s_no],
                (error, result) => {
    
                    if (error) {
                        res.json(null);
    
                    } else {
                        res.json(result.affectedRows);
                    }
                }
            )
        }
    },

    // 스토리 수정 컨펌 (async 사용)
    modifyConfirm : async function(req, res) {

        let post = req.body;

        let sql1 = `UPDATE TBL_STORY SET S_TXT = ?, S_IS_PUBLIC = ?, S_MOD_DATE = NOW() WHERE S_NO = ?`
        let sql2 = `DELETE FROM TBL_STORY_PICTURE WHERE SP_OWNER_NO = ?`
        let sql3 = `INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(?, ?)`
        
        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);
        let connection3 = await pool.getConnection(async conn => conn);
        
        connection1.beginTransaction();
        connection2.beginTransaction();
        connection3.beginTransaction();
                    
    },


    // 스토리 삭제 컨펌 (async 사용)
    deleteConfirm: async function(req, res) {

        let s_no = 14;         // req.body.s_no

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);

        let sql1 = `UPDATE TBL_STORY SET S_IS_DELETED = 1 WHERE S_NO = ?`;
        let sql2 = `UPDATE TBL_STORY_PICTURE SET SP_IS_DELETED = 1 WHERE SP_OWNER_NO = ?`;

        connection1.beginTransaction();
        connection2.beginTransaction();

        try {

            let delete1 = await connection1.query(sql1, [s_no]);
            
            if (delete1[0].affectedRows > 0) {

                try {

                    let delete2 = await connection2.query(sql2, [s_no]);
                    
                    if (delete2[0].affectedRows > 0) {
                        connection1.commit();
                        connection2.commit();
                    } else {
                        connection1.rollback();
                        connection2.rollback();
                    }
                    
                } catch (error2) {
                    res.json('error2');

                }

        } else {
            connection1.rollback();
            connection2.rollback();

        }
        
        res.json('delete1[0].affectedRows: ' + delete1[0].affectedRows);
        
        } catch (error) {
            console.log('error', error);
            connection1.rollback();
            res.json('error');

        } finally {
            connection1.release();
            connection2.release();

        }

    },
    


}

module.exports = storyService;
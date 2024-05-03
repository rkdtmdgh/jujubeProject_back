const DEV_PROD_VARIABLE = require('../config/config');
const DB = require('../db/DB');
const pool = require('../db/pool');
const { printLog } = require('../utils/logger');
const { verifyToken } = require('../utils/verify');

const DEFAULT_NAME = 'storyService';

const storyService = {

    // 스토리 작성 컨펌
    write_confirm: async function(req, res) {
        printLog(DEFAULT_NAME, 'write_confirm');

        let m_id = 'test.m_id';         // req.cookies.accessToken.verify(m_id);
        let post = 'test.post';         // req.body
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

            let write1 = await connection1.query(sql1, [m_id, post, 0]);    // (m_id, post.s_txt, post.s_is_public);
            
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
                        res.json(-1);

                    }
                    
                }
                } catch (error2) {
                    connection1.rollback();
                    connection2.rollback();
                    res.json(-1);

                }

        } else {
            connection1.rollback();
            connection2.rollback();
            res.json(-1);

        }
        
        res.json(write1[0].affectedRows);
        
        } catch (error) {
            connection1.rollback();
            connection2.rollback();
            res.json(-1);

        } finally {
            connection1.release();
            connection2.release();

        }

    },

    // 나 + 친구들의 모든 스토리 가져오기(홈 => 피드에 보이는 것)
    get_all_storys: async function(req, res) {
        printLog(DEFAULT_NAME, 'get_all_storys');

        

        // let m_id = verifyToken(req.cookies.accessToken).M_ID;
        let m_id = 'gildong';

        console.log('m_id: ', m_id);

        let getAllStorysResult = '';
        let append_sql = '';

        let sql1 = `SELECT F_ID FROM TBL_FRIEND WHERE F_OWNER_ID = ? AND F_IS_BLOCK = 0`;
        let sql2 = '';
        let sql3 = `SELECT * FROM TBL_STORY_PICTURE WHERE SP_OWNER_NO = ? AND SP_IS_DELETED = 0 ORDER BY SP_REG_DATE DESC`;
        let sql4 = `SELECT * FROM TBL_MEMBER WHERE M_ID = ?`;
        let sql5 = `SELECT COUNT(*) FROM TBL_STORY_LIKE WHERE SL_OWNER_STORY_NO = ? ORDER BY SL_REG_DATE DESC`;
        let sql6 = `SELECT SL_IS_LIKE FROM TBL_STORY_LIKE WHERE SL_OWNER_STORY_NO = ? AND SL_M_ID = ?`;
        let sql7 = `SELECT * FROM TBL_REPLY WHERE R_OWNER_STORY_NO = ? ORDER BY R_REG_DATE DESC`;
        
        DB.query(sql1, m_id, (error, friends) => {
           if (error) {
            res.json(-1);

           } else {
            
            for (let i = 0; i < Number(friends.length) - 1; i++) {
                append_sql += ` OR S_OWNER_ID = ? `;

            }

            append_sql += ` OR S_OWNER_ID = '${m_id}'`;
            sql2 = `SELECT * FROM TBL_STORY WHERE S_OWNER_ID = ? ${append_sql} AND S_IS_DELETED = 0 ORDER BY S_REG_DATE DESC`;

            DB.query(sql2, [...friends.map(item => item.F_ID)], (error, storys) => {
                if (error) {
                    res.json(-1);

                } else {

                    getAllStorysResult = storys;

                    for (let j = 0; j < storys.length; j++) {
                        
                        DB.query(sql3, storys[j].S_NO, (error, pictures) => {
                            if (error) {
                                res.json(-1);
                            
                            } else {
                                storys[j].pictures = pictures;

                                DB.query(sql4, storys[j].S_OWNER_ID, (error, memberInfors) => {
                                    if (error) {
                                        res.json(-1);

                                    } else {
                                        storys[j].memberInfors = memberInfors[0];
                                        
                                        DB.query(sql5, storys[j].S_NO, (error, likeCnt) => {
                                            if (error) {
                                                res.json(-1);

                                            } else {
                                                storys[j].storyLikeCnt = Number(likeCnt[0]['COUNT(*)']);

                                                DB.query(sql6, [storys[j].S_NO, m_id], (error, isLike) => {
                                                    if (error) {
                                                        res.json(-1);

                                                    } else {

                                                        console.log('isLike: ', isLike);
                                                        if (isLike[0] !== undefined) {
                                                            storys[j].storyIsLike = isLike[0]['SL_IS_LIKE'];
            
                                                        } else {
                                                            storys[j].storyIsLike = 0;

                                                            DB.query(sql7, storys[j].S_NO, (error, replys) => {
                                                                if (error) {
                                                                    res.json(-1);

                                                                } else {
                                                                    
                                                                    if (replys === null || replys.length === 0 || replys === undefined) {
                                                                        storys[j].replysCnt = 0;
                                                                        storys[j].replys = '';

                                                                    }

                                                                    storys[j].replysCnt = replys.length;
                                                                    storys[j].replys = replys;

                                                                }
                                                                console.log('storys:', storys);
                                                                res.json(storys);

                                                            })
            
                                                        }

                                                    }

                                                })

                                            }

                                        })

                                    }

                                })

                            }

                    })

                }

            }
        
        })

                

            }
            
           });
                    

    },

    // 내 모든 스토리 가져오기 (내 피드에서 보이는 것)
    get_my_storys: async function(req, res) {
        printLog(DEFAULT_NAME, 'get_my_storys');

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);
        
        let m_id = verifyToken(req.cookies.accessToken).m_id;

        let getMyStorysResult = [];

        let sql1 = `SELECT * FROM TBL_STORY WHERE S_OWNER_ID = ? AND S_IS_DELETED = 0 ORDER BY S_REG_DATE DESC`;
        let sql2 = `SELECT * FROM TBL_STORY_PICTURE WHERE SP_OWNER_NO = ? AND SP_IS_DELETED = 0 ORDER BY SP_REG_DATE DESC`;
        
        connection1.beginTransaction();
        connection2.beginTransaction();
        
        try {
            
            let [getMyStorys1] = await connection1.query(sql1, m_id);
            console.log('getMyStorys1.length: ', getMyStorys1.length);
            getMyStorysResult.push(getMyStorys1);
            console.log('getMyStorysResult: ', getMyStorysResult);
            
            if (getMyStorys1.length > 0) {
                
                for (let i = 0; i < getMyStorys1.length; i++) {
                    
                    try {
                        let [getMyStorys2] = await connection2.query(sql2, getMyStorys1[i].S_NO);
                        console.log('getMyStorys1[i].S_NO: ', getMyStorys1[i].S_NO);
                        console.log('getMyStorys2: ', getMyStorys2);
                        getMyStorys1[i].pictures = getMyStorys2;

                        connection1.commit();
                        connection2.commit();
                        
                    } catch (error2) {
                        connection1.rollback();
                        connection2.rollback();
                        res.json(-1);
                        
                    } 
                    
                }
                
                res.json(getMyStorysResult);
                
            } else {
                connection1.rollback();
                connection2.rollback();
                res.json('내 스토리가 없습니다.');

            }
                    
        } catch (error) {
            connection1.rollback();
            connection2.rollback();
            res.json(-1);

        } finally {
            connection1.release();
            connection2.release();

        }

    },
        

    // 스토리 한개 가져오기 (modify용) ==> 기존에 업로드 되어 있던 사진을 modify_confirm때 가져가야 함!
    get_story: async function(req, res) {
        printLog(DEFAULT_NAME, 'get_story');

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);

        let s_no = 11;      // req.query.s_no;

        let sql1 = `SELECT * FROM TBL_STORY WHERE S_NO = ? AND S_IS_DELETED = 0`;
        let sql2 = `SELECT * FROM TBL_STORY_PICTURE WHERE SP_OWNER_NO = ? AND SP_IS_DELETED = 0`;
        
        connection1.beginTransaction();
        connection2.beginTransaction();
        
        try {
            
            let [getStory1] = await connection1.query(sql1, s_no);
            console.log('getStory1: ', getStory1);
            
            if (getStory1 !== undefined) {
                    
                    try {
                        let [getStory2] = await connection2.query(sql2, getStory1[0].S_NO);
                        console.log('getStory1[0].S_NO: ', getStory1[0].S_NO);
                        console.log('getStory2: ', getStory2);
          
                        getStory1[0].pictures = getStory2;
                        console.log('getStory1: ', getStory1);

                        connection1.commit();
                        connection2.commit();
                        
                    } catch (error2) {
                        connection1.rollback();
                        connection2.rollback();
                        res.json(-1);
                        
                    } finally {
                        connection1.release();
                        connection2.release();
                    }
                
                res.json(getStory1);

            } else {
                connection1.rollback();
                connection2.rollback();
                res.json('스토리를 가져오지 못했습니다.');

            }
                    
        } catch (error) {
            connection1.rollback();
            connection2.rollback();
            res.json(-1);

        } finally {
            connection1.release();
            connection2.release();

        }

    },

    // 스토리 수정 컨펌
    modify_confirm : async function(req, res) {
        printLog(DEFAULT_NAME, 'modify_confirm');

        let arr1 = ['a', 'b', 'c', 'd', 'e'];   // 기존사진
        let arr2 = ['b', 'e', 'f', 'g', 'h'];   // 추가된 사진 (사용자가 올린 사진)
        let arr3 = ['a', 'b', 'c', 'd', 'e'];   // 남겨진 사진 (필요없음!)

        let del = arr1.filter(v =>!arr2.includes(v));
        let add = arr2.filter(v => arr1.includes(v));
        add = add.concat(arr2.filter(v => !arr1.includes(v)));
        console.log('del: ', del);
        console.log('add: ', add);

        let sql1 = `UPDATE TBL_STORY SET S_TXT = ?, S_IS_PUBLIC = ?, S_MOD_DATE = NOW() WHERE S_NO = ?`;    // cnt로 사진이름 검색해서 1이면 안들어가게, 0이면 들어가게!!
        let sql2 = `UPDATE TBL_STORY_PICTURE SET SP_IS_DELETED = 1 WHERE SP_OWNER_NO = ?`;
        let sql3 = `INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(?, ?)`;
        
        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);
        let connection3 = await pool.getConnection(async conn => conn);
        
        connection1.beginTransaction();
        connection2.beginTransaction();
        connection3.beginTransaction();

        try {
            
            let [modify1] = await connection1.query(sql1, [req.body.s_txt, req.body.s_is_public, req.body.s_no]);
            console.log('modify1: ', modify1);






        } catch (error) {
            connection1.rollback();
            connection2.rollback();
            connection3.rollback();
            res.json(-1);

        } finally {
            connection1.release();
            connection2.release();
            connection3.release();

        }
                    
    },

    // 스토리 삭제 컨펌
    delete_confirm: async function(req, res) {
        printLog(DEFAULT_NAME, 'delete_confirm');

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
                        res.json(-1);
                    }
                    
                } catch (error2) {
                    res.json('error2');

                }

        } else {
            connection1.rollback();
            connection2.rollback();
            res.json(-1);

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
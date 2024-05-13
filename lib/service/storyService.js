const DEV_PROD_VARIABLE = require('../config/config');
const DB = require('../db/DB');
const pool = require('../db/pool');
const { printLog } = require('../utils/logger');
const { verifyToken } = require('../utils/jwt');
const fs = require('fs');
const fs_extra = require('fs-extra');

const DEFAULT_NAME = 'storyService';

const storyService = {

    // 스토리 작성 컨펌 (transaction 사용)
    write_confirm: async function(req, res, savedDir) {
        printLog(DEFAULT_NAME, 'write_confirm');

        // let m_id = verifyToken(req.cookies.accessToken).m_id;
        let m_id = verifyToken(req.headers['authorization']).m_id;

        console.log('m_id: ', m_id);
        // let m_id = 'gildong';
        let post = req.body;
        console.log('post: ', post);
        console.log('req.files', req.files);

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);

        let sql1 = `INSERT INTO 
                        TBL_STORY(
                                    S_OWNER_ID, 
                                    S_TXT, 
                                    S_IS_PUBLIC) 
                        VALUES(?, ?, ?)`;
        let sql2 = `INSERT INTO 
                        TBL_STORY_PICTURE(
                                            SP_OWNER_NO, 
                                            SP_PICTURE_NAME, 
                                            SP_SAVE_DIR) 
                        VALUES(?, ?, ?)`;

        connection1.beginTransaction();
        connection2.beginTransaction();

        try {

            let write1 = await connection1.query(sql1, [m_id, post.s_txt, post.s_is_public]);
            
            if (write1[0].affectedRows > 0) {

                let completedQueries = 0;

                try {

                    for (i = 0; i < req.files.length; i++) {

                    let write2 = await connection2.query(sql2, [write1[0].insertId, req.files[i].filename, savedDir]);
                    
                    if (write2[0].affectedRows > 0) {
                        connection1.commit();
                        connection2.commit();
                        completedQueries++;

                        if (completedQueries === req.files.length) res.json(write2[0].affectedRows);

                    } else {
                        connection1.rollback();
                        connection2.rollback();
                        res.json(null);

                    }
                    
                }
                } catch (error2) {
                    connection1.rollback();
                    connection2.rollback();
                    res.json(null);

                }

        } else {
            connection1.rollback();
            connection2.rollback();
            res.json(null);

        }
        
        } catch (error) {
            connection1.rollback();
            connection2.rollback();
            res.json(null);

        } finally {
            connection1.release();
            connection2.release();

        }

    },

    // 나 + 친구들의 모든 스토리 가져오기(홈 => 피드에 보이는 것)   // DB.query방식 (기존에 하던방식 => 시간소요 제일 적음) 트랜젝션, 프로미스 객체, 스퀄라이즈 로도 해보기
    get_all_storys: (req, res) => {
        printLog(DEFAULT_NAME, 'get_all_storys');

        // let m_id = verifyToken(req.cookies.accessToken).m_id;
        let m_id = verifyToken(req.headers['authorization']).m_id;
        // let m_id = 'gildong';

        console.log('m_id: ', m_id);

        let sql1 = `SELECT s.* 
                            FROM TBL_STORY s 
                            WHERE (s.S_OWNER_ID IN (
                                    SELECT F_ID 
                                    FROM TBL_FRIEND 
                                    WHERE F_OWNER_ID = ? AND F_IS_BLOCK = 0 
                                ) OR s.S_OWNER_ID = ?) 
                                AND s.S_IS_DELETED = 0 
                                AND ( 
                                    s.S_IS_PUBLIC = 0 
                                    OR s.S_IS_PUBLIC = 1 
                                    OR (s.S_IS_PUBLIC = -1 AND s.S_OWNER_ID = ?) 
                                ) 
                            ORDER BY s.S_REG_DATE DESC`

        let sql2 = `SELECT * FROM 
                        TBL_STORY_PICTURE 
                            WHERE 
                                SP_OWNER_NO = ? 
                                AND SP_IS_DELETED = 0 
                                ORDER BY SP_NO ASC`;
        let sql3 = `SELECT * FROM 
                        TBL_MEMBER 
                            WHERE 
                                M_ID = ?`;
        let sql4 = `SELECT COUNT(*) FROM 
                        TBL_STORY_LIKE 
                            WHERE 
                                SL_OWNER_STORY_NO = ? 
                                AND SL_IS_LIKE = 1`;
        let sql5 = `SELECT SL_IS_LIKE FROM 
                        TBL_STORY_LIKE 
                            WHERE 
                                SL_OWNER_STORY_NO = ? 
                                AND SL_M_ID = ?`;
        let sql6 = `SELECT COUNT(*) FROM 
                        TBL_REPLY 
                            WHERE 
                                R_OWNER_STORY_NO = ? 
                                AND R_IS_DELETED = 0`;
        
        DB.query(sql1, [m_id, m_id, m_id], (error1, storys) => {
        
                if (error1) {
                    console.log('error1', error1);
                    res.json(null);

                } else {
                    let completedQueries = 0; 
                    
                    for (let j = 0; j < storys.length; j++) {
                        
                        DB.query(sql2, storys[j].S_NO, (error2, pictures) => {
                            if (error2) {
                                console.log('error2', error2);
                                res.json(null);
                            
                            } else {
                                storys[j].pictures = pictures;

                                DB.query(sql3, storys[j].S_OWNER_ID, (error3, memberInfors) => {
                                    if (error3) {
                                        console.log('error3', error3);
                                        res.json(null);

                                    } else {
                                        storys[j].memberInfors = memberInfors;
                                        
                                        DB.query(sql4, storys[j].S_NO, (error4, likeCnt) => {
                                            if (error4) {
                                                console.log('error4', error4);
                                                res.json(null);

                                            } else {
                                                storys[j].storyLikeCnt = Number(likeCnt[0]['COUNT(*)']);

                                                DB.query(sql5, [storys[j].S_NO, m_id], (error5, isLike) => {
                                                    if (error5) {
                                                        console.log('error5', error5);
                                                        res.json(null);

                                                    } else {

                                                        if (isLike[0] !== undefined) {
                                                            storys[j].storyIsLike = isLike[0]['SL_IS_LIKE'];
            
                                                        } else {
                                                            storys[j].storyIsLike = -1;

                                                        }
                                                            DB.query(sql6, storys[j].S_NO, (error6, replysCnt) => {
                                                                if (error6) {
                                                                    console.log('error6',error6);
                                                                    res.json(null);

                                                                } else {
                                                                        storys[j].replysCnt = replysCnt ? replysCnt[0]['COUNT(*)'] : 0;
                                                                        completedQueries++;

                                                                        if (completedQueries === storys.length) {
                                                                            res.json(storys);
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
                            
                                })

                            }
                            
                        }
                    })

    },

    // 내 모든 스토리 가져오기 (내 피드에서 보이는 것)
    get_my_storys: async function(req, res) {
        printLog(DEFAULT_NAME, 'get_my_storys');
        
        // let m_id = verifyToken(req.cookies.accessToken).m_id;
        let m_id = verifyToken(req.headers['authorization']).m_id;

        let sql1 = `SELECT * FROM 
                        TBL_STORY 
                            WHERE 
                                S_OWNER_ID = ? 
                                AND S_IS_DELETED = 0 
                                ORDER BY S_REG_DATE DESC`;
        let sql2 = `SELECT * FROM 
                        TBL_STORY_PICTURE 
                            WHERE 
                                SP_OWNER_NO = ? 
                                AND SP_IS_DELETED = 0 
                                ORDER BY SP_NO ASC`;
        let sql3 = `SELECT * FROM 
                            TBL_MEMBER 
                                WHERE 
                                    M_ID = ?`;
        let sql4 = `SELECT COUNT(*) FROM 
                            TBL_STORY_LIKE 
                                WHERE 
                                    SL_OWNER_STORY_NO = ? 
                                    AND SL_IS_LIKE = 1`;
        let sql5 = `SELECT SL_IS_LIKE FROM 
                            TBL_STORY_LIKE 
                                WHERE 
                                    SL_OWNER_STORY_NO = ? 
                                    AND SL_M_ID = ?`;
        let sql6 = `SELECT COUNT(*) FROM 
                            TBL_REPLY 
                                WHERE 
                                    R_OWNER_STORY_NO = ? 
                                    AND R_IS_DELETED = 0`;
        
        DB.query(sql1, m_id, (error1, storys) => {
        
                if (error1) {
                    console.log('error1', error1);
                    res.json(null);

                } else {
                    let completedQueries = 0; 
                    
                    for (let j = 0; j < storys.length; j++) {
                        
                        DB.query(sql2, storys[j].S_NO, (error2, pictures) => {
                            if (error2) {
                                console.log('error2', error2);
                                res.json(null);
                            
                            } else {
                                storys[j].pictures = pictures;

                                DB.query(sql3, storys[j].S_OWNER_ID, (error3, memberInfors) => {
                                    if (error3) {
                                        console.log('error3', error3);
                                        res.json(null);

                                    } else {
                                        storys[j].memberInfors = memberInfors;
                                        
                                        DB.query(sql4, storys[j].S_NO, (error4, likeCnt) => {
                                            if (error4) {
                                                console.log('error4', error4);
                                                res.json(null);

                                            } else {
                                                storys[j].storyLikeCnt = Number(likeCnt[0]['COUNT(*)']);

                                                DB.query(sql5, [storys[j].S_NO, m_id], (error5, isLike) => {
                                                    if (error5) {
                                                        console.log('error5', error5);
                                                        res.json(null);

                                                    } else {
                                                        if (isLike[0] !== undefined) {
                                                            storys[j].storyIsLike = isLike[0]['SL_IS_LIKE'];
            
                                                        } else {
                                                            storys[j].storyIsLike = -1;

                                                        }
                                                            DB.query(sql6, storys[j].S_NO, (error6, replysCnt) => {
                                                                if (error6) {
                                                                    console.log('error6',error6);
                                                                    res.json(null);

                                                                } else {
                                                                        storys[j].replysCnt = replysCnt ? replysCnt[0]['COUNT(*)'] : 0;
                                                                        completedQueries++;

                                                                        if (completedQueries === storys.length) {
                                                                            res.json(storys);
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
                            
                                })

                            }
                            
                        }
                    })
        
    },

    // 스토리 한개 가져오기 (modify용) ==> 기존에 업로드 되어 있던 사진을 modify_confirm때 가져가야 함!
    get_story: async function(req, res) {
        printLog(DEFAULT_NAME, 'get_story');

        let s_no = req.query.s_no;
        // let m_id = verifyToken(req.cookies.accessToken).m_id;
        let m_id = verifyToken(req.headers['authorization']).m_id;

        // let s_no = 46;
        // let m_id = 'gildong';

        let sql1 = `SELECT * FROM 
                        TBL_STORY 
                            WHERE 
                                S_NO = ? 
                                AND S_IS_DELETED = 0`;
        let sql2 = `SELECT * FROM 
                        TBL_STORY_PICTURE 
                            WHERE 
                                SP_OWNER_NO = ? 
                                AND SP_IS_DELETED = 0 
                                ORDER BY SP_NO ASC`;
        let sql3 = `SELECT * FROM 
                        TBL_MEMBER 
                            WHERE 
                                M_ID = ?`;
        let sql4 = `SELECT COUNT(*) FROM 
                            TBL_STORY_LIKE 
                                WHERE 
                                    SL_OWNER_STORY_NO = ? 
                                    AND SL_IS_LIKE = 1`;
        let sql5 = `SELECT SL_IS_LIKE FROM 
                            TBL_STORY_LIKE 
                                WHERE 
                                    SL_OWNER_STORY_NO = ? 
                                    AND SL_M_ID = ?`;
        let sql6 = `SELECT COUNT(*) FROM 
                            TBL_REPLY 
                                WHERE 
                                    R_OWNER_STORY_NO = ? 
                                    AND R_IS_DELETED = 0`;
        
        DB.query(sql1, s_no, (error1, story) => {
        
                if (error1) {
                    console.log('error1', error1);
                    res.json(null);

                } else {
                        
                        DB.query(sql2, story[0].S_NO, (error2, pictures) => {
                            if (error2) {
                                console.log('error2', error2);
                                res.json(null);
                            
                            } else {
                                story[0].pictures = pictures;

                                DB.query(sql3, story[0].S_OWNER_ID, (error3, memberInfors) => {
                                    if (error3) {
                                        console.log('error3', error3);
                                        res.json(null);

                                    } else {
                                        story[0].memberInfors = memberInfors;
                                        
                                        DB.query(sql4, story[0].S_NO, (error4, likeCnt) => {
                                            if (error4) {
                                                console.log('error4', error4);
                                                res.json(null);

                                            } else {
                                                story[0].storyLikeCnt = Number(likeCnt[0]['COUNT(*)']);

                                                DB.query(sql5, [story[0].S_NO, m_id], (error5, isLike) => {
                                                    if (error5) {
                                                        console.log('error5', error5);
                                                        res.json(null);

                                                    } else {
                                                        if (isLike[0] !== undefined) {
                                                            story[0].storyIsLike = isLike[0]['SL_IS_LIKE'];
            
                                                        } else {
                                                            story[0].storyIsLike = -1;

                                                        }
                                                            DB.query(sql6, story[0].S_NO, (error6, replysCnt) => {
                                                                if (error6) {
                                                                    console.log('error6',error6);
                                                                    res.json(null);

                                                                } else {
                                                                        story[0].replysCnt = replysCnt ? replysCnt[0]['COUNT(*)'] : 0;
                                                                        res.json(story);

                                                                    }
                                                                    
                                                                })
                                                                
                                                            }
                                                            
                                                        })
                                                        
                                                    }

                                                })
                                                
                                            }

                                        })
                                        
                                    }
                            
                                })
                            
                        }
                    })

    },

    // 스토리 수정 컨펌 (transaction 사용)
    modify_confirm : async function(req, res) {
        printLog(DEFAULT_NAME, 'modify_confirm');

        // let post = req.body;
        // let newImg = req.files;
        let m_id = verifyToken(req.headers['authorization']).m_id;

        let post = {                                            // req.body;
            's_txt' : '1번스토리 수정 확인용',
            's_is_public' : 1,
            's_no' : 1,
        }

        // let curImg = ['a', 'b', 'c', 'd', 'e'];          // req.body.curImg; 기존사진 배열로 던져달라고 하기
        let curImg = [
            {
                'sp_no' : 1,
                'sp_picture_name' : 'a'
            },
            {
                'sp_no' : 2,
                'sp_picture_name' : 'b'
            },
            {
                'sp_no' : 3,
                'sp_picture_name' : 'c'
            },
            {
                'sp_no' : 4,
                'sp_picture_name' : 'd'
            },
            {
                'sp_no' : 5,
                'sp_picture_name' : 'e'
            },
        ]
        
        // let keepImg = ['a', 'b'];                        // req.body.keepImg; 유지할 사진도 던져달라고 하기
        
        let keepImg = [
            {
                'sp_no' : 1,
                'sp_picture_name' : 'a'
            },
            {
                'sp_no' : 2,
                'sp_picture_name' : 'b'
            },
        ]
        
        // let newImg = ['f', 'g'];                         // req.file; 새로 받아온 파일만 담김! 유지하는 사진은 담겨오지 않음!!

        let newImg = [
            {
                'sp_picture_name' : 'abc'
            },
            {
                'sp_picture_name' : 'abc'
            },
            {
                'sp_picture_name' : 'cc'
            },
            {
                'sp_picture_name' : 'dd'
            },
            {
                'sp_picture_name' : 'ee'
            },
            {
                'sp_picture_name' : 'ff'
            },
            {
                'sp_picture_name' : 'gg'
            },

        ]

        let delImg = curImg.filter(curItem => !keepImg.some(keepItem => keepItem.sp_picture_name === curItem.sp_picture_name));      // 기존사진에서 유지하고 싶지 않은 사진들만 골라냈음!

        console.log("================================delImg: ", delImg);

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);
        let connection3 = await pool.getConnection(async conn => conn);
        let connection4 = await pool.getConnection(async conn => conn);

        let sql1 = `UPDATE TBL_STORY 
                            SET 
                                S_TXT = ?, 
                                S_IS_PUBLIC = ?, 
                                S_MOD_DATE = NOW() 
                            WHERE 
                                S_NO = ?`;                                                                              // 스토리 내용 수정
        let sql2 = `UPDATE TBL_STORY_PICTURE 
                            SET 
                                SP_PICTURE_NAME = ?, 
                                SP_MOD_DATE = NOW() 
                            WHERE 
                                SP_NO = ?`;                                                                             // 변경된 사진 사진 이름만 UPDATE
        let sql3 = `UPDATE TBL_STORY_PICTURE 
                            SET 
                                SP_IS_DELETED = 1, 
                                SP_DELETED_DATE = NOW() 
                            WHERE 
                                SP_NO = ?`;                                                                             // 삭제되는 사진들 SP_IS_DELETED = 1로 설정
        let sql4 = `INSERT INTO 
                            TBL_STORY_PICTURE(
                                                SP_OWNER_NO, 
                                                SP_PICTURE_NAME) 
                            VALUES(?, ?)`;                                                                              // 추가되는 사진들 INSERT
        
        connection1.beginTransaction();
        connection2.beginTransaction();
        connection3.beginTransaction();
        connection4.beginTransaction();

        try {
            let modify1 = await connection1.query(sql1, [post.s_txt, post.s_is_public, post.s_no]);

            let completedQueries = 0;

            if (modify1[0].affectedRows > 0) { 
                console.log('modify1 success!!');

                try {

                    if (newImg.length <= delImg.length) {                   // 새로 추가되는 사진의 길이가 삭제되는 사진의 갯수보다 작거나 같은 경우

                        console.log('newImg.length:', newImg.length);

                        for (let i = 0; i < newImg.length; i++) {

                            let modify2 = await connection2.query(sql2, [newImg[i].sp_picture_name, delImg[i].sp_no]);
                            if (modify2[0].affectedRows > 0) {
                                console.log('modify2 sucess!!');
                                completedQueries++;

                            } else {
                                console.log('modify2 fail!!');
                                connection1.rollback();
                                connection2.rollback();
                                res.json(null);

                            }

                            if (completedQueries === newImg.length) {

                                delImg.splice(0, newImg.length);

                                try {
    
                                    for (let j = 0; j < delImg.length; j++) {
            
                                        let modify3 = await connection3.query(sql3, [delImg[j].sp_no]);
                                        if (modify3[0].affectedRows > 0) {
                                            console.log('modify3 sucess!!');
            
                                        } else {
                                            console.log('modify3 fail!!');
                                            connection1.rollback();
                                            connection2.rollback();
                                            connection3.rollback();
                                            res.json(null);
            
                                        }
            
                                    }
    
                                    connection1.commit();
                                    connection2.commit();
                                    connection3.commit();
                                    res.json(modify1[0].affectedRows);
                                    return;
    
                                    } catch (error3) {
                                        connection1.rollback();
                                        connection2.rollback();
                                        connection3.rollback();
                                        res.json(null);
    
                                    }

                            }

                    }

                    } else {                                                        // 새로 추가되는 사진의 길이가 삭제되는 사진의 갯수보다 큰 경우
                        
                        for (let i = 0; i < delImg.length; i++) {

                            let modify2 = await connection2.query(sql2, [newImg[i].sp_picture_name, delImg[i].sp_no]);
                                if (modify2[0].affectedRows > 0) {
                                    console.log('modify2 sucess!!');
                                    completedQueries++;

                                } else {
                                    console.log('modify2 fail!!');
                                    connection1.rollback();
                                    connection2.rollback();
                                    res.json(null);
                                    
                                }

                                if (completedQueries === delImg.length) {

                                    newImg.splice(0, delImg.length);

                                try {

                                    for (let j = 0; j < newImg.length; j++) {

                                        let modify4 = await connection4.query(sql4, [post.s_no, newImg[j].sp_picture_name]);
                                        if (modify4[0].affectedRows > 0) {
                                            console.log('modify4 sucess!!');
                                        
                                        } else {
                                            console.log('modify4 fail!!');
                                            connection1.rollback();
                                            connection2.rollback();
                                            connection4.rollback();
                                            res.json(null);
            
                                        }
            
                                    }

                                    connection1.commit();
                                    connection2.commit();
                                    connection4.commit();
                                    res.json(modify2[0].affectedRows);
                                    return;

                                } catch (error4) {
                                    connection1.rollback();
                                    connection2.rollback();
                                    connection4.rollback();
                                    res.json(null);

                                }

                            }

                        }

                    }

                } catch (error2) {
                    console.log('error2', error2);
                    connection1.rollback();
                    connection2.rollback();
                    connection3.rollback();
                    connection4.rollback();
                    res.json(null);

                }

            } else {
                connection1.rollback();
                connection2.rollback();
                connection3.rollback();
                connection4.rollback();
                res.json(null);

            }

        } catch (error1) {
            console.log('error1', error1);
            connection1.rollback();
            connection2.rollback();
            connection3.rollback();
            connection4.rollback();
            res.json(null);


        } finally {
            connection1.release();
            connection2.release();
            connection3.release();
            connection4.release();

        }
                    
    },
    


    // 스토리 삭제 컨펌 (DB.query 사용) => (원본)
    /*
    delete_confirm: (req, res) => {
        printLog(DEFAULT_NAME, 'delete_confirm');

        let s_no = req.body.s_no;

        let sql1 = `UPDATE TBL_STORY SET S_IS_DELETED = 1, S_DELETED_DATE = NOW() WHERE S_NO = ?`;

        DB.query(sql1, [s_no], (error, result) => {
            if (error) {
                console.log('error: ', error);
                res.json(null);

            } else {
                res.json(result.affectedRows);

            }

        })

    },
    */

    // 스토리 삭제 컨펌 (트랜젝션 사용) => 스토리, 스토리의 사진들, 스토리의 댓글들 전부 IS_DELETED = 1로 바꾸고 / 스토리의 사진들 폴더에서 삭제하기.
    // 기존코드
    /*
    delete_confirm: async function (req, res) {
        printLog(DEFAULT_NAME, 'delete_confirm');

        // let s_no = req.body.s_no;
        let m_id = verifyToken(req.headers['authorization']).m_id;
        let post = req.body;
        
        console.log('m_id: ', m_id);
        console.log('req.body.s_no: ', post.s_no);

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);
        let connection3 = await pool.getConnection(async conn => conn);

        let sql1 = `UPDATE 
                        TBL_STORY 
                    SET 
                        S_IS_DELETED = 1, 
                        S_DELETED_DATE = NOW() 
                    WHERE 
                        S_NO = ?`;

        let sql2 = `UPDATE 
                        TBL_STORY_PICTURE 
                    SET 
                        SP_IS_DELETED = 1, 
                        SP_DELETED_DATE = NOW() 
                    WHERE 
                        SP_OWNER_NO = ?`;

        let sql3 = `UPDATE 
                        TBL_REPLY 
                    SET 
                        R_IS_DELETED = 1, 
                        R_DELETED_DATE = NOW() 
                    WHERE 
                        R_OWNER_STORY_NO = ?`;

        let sql4 = `SELECT 
                        SP_SAVE_DIR 
                    FROM 
                        TBL_STORY_PICTURE 
                    WHERE 
                        SP_OWNER_NO = ?`;

        connection1.beginTransaction();
        connection2.beginTransaction();
        connection3.beginTransaction();

        try {
            let delete1 = await connection1.query(sql1, [post.s_no]);
            if (delete1[0].affectedRows > 0) {
                console.log('delete1 sucess!!');

                try {

                    let delete2 = await connection2.query(sql2, [post.s_no]);
                    if (delete2[0].affectedRows > 0) {
                        console.log('delete2 sucess!!');

                        try {

                            let delete3 = await connection3.query(sql3, [post.s_no]);
                            if (delete3[0].affectedRows >= 0) {
                                console.log('delete3 sucess!!');
                                
                                DB.query(sql4, [post.s_no], (error4, sp_pictures) => {
                                    if (error4) {
                                        console.log('error4: ', error4);
                                        res.json(null);

                                    } else {

                                        fs_extra.remove(`${DEV_PROD_VARIABLE.STORY_PICTURES_DIR}${m_id}\\${sp_pictures[0].SP_SAVE_DIR}`, (error4) => {
                                            if (error4) {
                                                printLog(DEFAULT_NAME,'delete confirm fs.unlink err', error4);
                                                return;

                                            } else {
                                                connection1.commit();
                                                connection2.commit();
                                                connection3.commit();
                                                res.json(delete1[0].affectedRows);
                                                console.log('delete4 sucess!!');

                                            }
                                            
                                        });
                                        
                                    }
                                    
                                });

                            } else {
                                console.log('delete3 fail!!');
                                connection1.rollback();
                                connection2.rollback();
                                connection3.rollback();
                                res.json(null);

                            }


                        } catch (error3) {
                            console.log('error3', error3);
                            connection1.rollback();
                            connection2.rollback();
                            connection3.rollback();
                            res.json(null);

                        }

                    } else {
                        console.log('delete2 fail!!');
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

            } else {
                console.log('delete1 fail!!');
                connection1.rollback();
                res.json(null);

            }

        } catch (error1) {
            console.log('error1', error1);
            connection1.rollback();
            res.json(null);

        } finally {
            connection1.release();
            connection2.release();
            connection3.release();

        }

    },
    */
    
    


    // 모든 커밋, 롤백, 릴리즈에 await 싹 다 걸어주기!
    
    delete_confirm : async function (req, res) {
        printLog(DEFAULT_NAME, 'delete_confirm');
    
        const m_id = verifyToken(req.headers['authorization']).m_id; 
        const post = req.body;
    
        console.log('m_id: ', m_id);
        console.log('req.body.s_no: ', post.s_no);
    
        const connection = await pool.getConnection();
    
        try {
            await connection.beginTransaction();
    
            const sql1 = `
                UPDATE TBL_STORY 
                SET S_IS_DELETED = 1, S_DELETED_DATE = NOW() 
                WHERE S_NO = ?
            `;
            const [result1] = await connection.query(sql1, [post.s_no]);
    
            if (result1.affectedRows > 0) {
                console.log('delete1 sucess!!');
    
                const sql2 = `
                    UPDATE TBL_STORY_PICTURE 
                    SET SP_IS_DELETED = 1, SP_DELETED_DATE = NOW() 
                    WHERE SP_OWNER_NO = ? 
                `;
                const [result2] = await connection.query(sql2, [post.s_no]);
    
                if (result2.affectedRows > 0) {
                    console.log('delete2 sucess!!');
    
                    const sql3 = `
                        UPDATE TBL_REPLY 
                        SET R_IS_DELETED = 1, R_DELETED_DATE = NOW() 
                        WHERE R_OWNER_STORY_NO = ? 
                    `;
                    const [result3] = await connection.query(sql3, [post.s_no]);
    
                    if (result3.affectedRows >= 0) {
                        console.log('delete3 sucess!!');
    
                        const sql4 = `
                            SELECT SP_SAVE_DIR 
                            FROM TBL_STORY_PICTURE 
                            WHERE SP_OWNER_NO = ? 
                        `;
                        const [spPictures] = await connection.query(sql4, [post.s_no]);
    
                        if (spPictures.length > 0) {
                            const picturePath = `${DEV_PROD_VARIABLE.STORY_PICTURES_DIR}${m_id}\\${spPictures[0].SP_SAVE_DIR}`;
                            await fs_extra.remove(picturePath);
                            console.log('delete4 sucess!!');
                        }
                    }
                }
    
                await connection.commit();
                res.json(result1.affectedRows);
                console.log('result1.affectedRows: ', result1.affectedRows);
            } else {
                console.log('delete1 fail!!');
                await connection.rollback();
                res.json(null);
            }
        } catch (error) {
            console.log('Error:', error);
            await connection.rollback();
            res.json(null);
        } finally {
            await connection.release();
        }
    },
    
    
    // 스토리 좋아요 버튼 눌렀을 시 좋아요 상태 업데이트
    story_like_update: (req, res) => {
        printLog(DEFAULT_NAME, 'story_like_update');

        let post = req.body;
        let m_id = verifyToken(req.headers['authorization']).m_id;

        let sl_update_num = post.sl_is_like === 0 ? 1 : 0;

        let sql1 = `INSERT INTO 
                        TBL_STORY_LIKE(
                                        SL_OWNER_STORY_NO, 
                                        SL_M_ID) 
                        VALUES (?, ?)`;
        let sql2 = `UPDATE 
                        TBL_STORY_LIKE 
                    SET 
                        SL_IS_LIKE = ${sl_update_num} 
                    WHERE 
                        SL_OWNER_STORY_NO = ? 
                        AND SL_M_ID = ?`

        if (post.sl_is_like === -1) {

            DB.query(sql1, [post.s_no, post.m_id], (error, result) => {
                if (error) { 
                    console.log('error: ', error);
                    res.json(null);

                } else {
                    res.json(result.affectedRows);

                }

            });

        } else {
            DB.query(sql2, [post.s_no, post.m_id], (error, result) => {
                if (error) {
                    console.log('error: ', error);
                    res.json(null);

                } else {
                    res.json(result.affectedRows);

                }

            });

        }

    },


}

module.exports = storyService;
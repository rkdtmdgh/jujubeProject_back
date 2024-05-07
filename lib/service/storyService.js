const DEV_PROD_VARIABLE = require('../config/config');
const DB = require('../db/DB');
const pool = require('../db/pool');
const { printLog } = require('../utils/logger');
const { verifyToken } = require('../utils/jwt');

const DEFAULT_NAME = 'storyService';

const storyService = {

    // 스토리 작성 컨펌 (transaction 사용)
    write_confirm: async function(req, res) {
        printLog(DEFAULT_NAME, 'write_confirm');

        let m_id = verifyToken(req.cookies.accessToken).M_ID;         // verifyToken(req.cookies.accessToken).M_ID;
        let post = req.body;
        console.log('post: ', post);
        console.log('req.file', req.file);
        let story_fileNames = req.file ? req.file.filenames : null;    // req.file ? req.file.filenames : null;

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);

        let sql1 = `INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES(?, ?, ?)`;
        let sql2 = `INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(?, ?)`;

        connection1.beginTransaction();
        connection2.beginTransaction();

        try {

            let write1 = await connection1.query(sql1, [m_id, post.s_txt, post.s_is_public]);    // (m_id, post.s_txt, post.s_is_public);
            
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
        
        res.json(write1[0].affectedRows);
        
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

        let m_id = verifyToken(req.cookies.accessToken).m_id;

        console.log('m_id: ', m_id);

        let sql1 = `SELECT s.*
        FROM TBL_STORY s
        WHERE (s.S_OWNER_ID IN (
            SELECT F_ID
            FROM TBL_FRIEND
            WHERE F_OWNER_ID = ? AND F_IS_BLOCK = 0
        ) OR s.S_OWNER_ID = ?) AND s.S_IS_DELETED = 0 AND (s.S_IS_PUBLIC = 0 OR s.S_IS_PUBLIC = 1) 
        ORDER BY s.S_REG_DATE DESC;`

        let sql2 = `SELECT * FROM TBL_STORY_PICTURE WHERE SP_OWNER_NO = ? AND SP_IS_DELETED = 0 ORDER BY SP_REG_DATE DESC`;
        let sql3 = `SELECT * FROM TBL_MEMBER WHERE M_ID = ?`;
        let sql4 = `SELECT COUNT(*) FROM TBL_STORY_LIKE WHERE SL_OWNER_STORY_NO = ? ORDER BY SL_REG_DATE DESC`;
        let sql5 = `SELECT SL_IS_LIKE FROM TBL_STORY_LIKE WHERE SL_OWNER_STORY_NO = ? AND SL_M_ID = ?`;
        let sql6 = `SELECT * FROM TBL_REPLY WHERE R_OWNER_STORY_NO = ? ORDER BY R_REG_DATE DESC`;
        
        DB.query(sql1, [m_id, m_id], (error1, storys) => {
         
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

                                                        console.log('isLike: ', isLike);
                                                        if (isLike[0] !== undefined) {
                                                            storys[j].storyIsLike = isLike[0]['SL_IS_LIKE'];
                                                            storys[j].storyIsLike = isLike[0]['SL_IS_LIKE'];
            
                                                        } else {
                                                            storys[j].storyIsLike = 0;

                                                        }
                                                            DB.query(sql6, storys[j].S_NO, (error6, replys) => {
                                                                if (error6) {
                                                                    res.json(null);
                                                                    console.log('error6',error6);

                                                                } else {
                                                                    console.log('[storys[j].S_NO]', storys[j].S_NO);
                                                                    
                                                                        storys[j].replysCnt = replys ? replys.length : 0;
                                                                        storys[j].replys = replys? replys : '';
                                                                        completedQueries++;

                                                                        if (completedQueries === storys.length) {
                                                                            console.log(storys);
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
        
        let m_id = verifyToken(req.cookies.accessToken).m_id;

        let sql1 = `SELECT * FROM TBL_STORY WHERE S_OWNER_ID = ? AND S_IS_DELETED = 0 ORDER BY S_REG_DATE DESC`;
        let sql2 = `SELECT * FROM TBL_STORY_PICTURE WHERE SP_OWNER_NO = ? AND SP_IS_DELETED = 0 ORDER BY SP_REG_DATE DESC`;
        let sql3 = `SELECT * FROM TBL_MEMBER WHERE M_ID = ?`;
        let sql4 = `SELECT COUNT(*) FROM TBL_STORY_LIKE WHERE SL_OWNER_STORY_NO = ? ORDER BY SL_REG_DATE DESC`;
        let sql5 = `SELECT SL_IS_LIKE FROM TBL_STORY_LIKE WHERE SL_OWNER_STORY_NO = ? AND SL_M_ID = ?`;
        let sql6 = `SELECT * FROM TBL_REPLY WHERE R_OWNER_STORY_NO = ? ORDER BY R_REG_DATE DESC`;
        
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

                                                        console.log('isLike: ', isLike);
                                                        if (isLike[0] !== undefined) {
                                                            storys[j].storyIsLike = isLike[0]['SL_IS_LIKE'];
                                                            storys[j].storyIsLike = isLike[0]['SL_IS_LIKE'];
            
                                                        } else {
                                                            storys[j].storyIsLike = 0;

                                                        }
                                                            DB.query(sql6, storys[j].S_NO, (error6, replys) => {
                                                                if (error6) {
                                                                    res.json(null);
                                                                    console.log('error6',error6);

                                                                } else {
                                                                    console.log('[storys[j].S_NO]', storys[j].S_NO);
                                                                    
                                                                        storys[j].replysCnt = replys ? replys.length : 0;
                                                                        storys[j].replys = replys? replys : '';
                                                                        completedQueries++;

                                                                        if (completedQueries === storys.length) {
                                                                            console.log(storys);
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

        let s_no = 16;          // req.query.s_no;
        let m_id = verifyToken(req.cookies.accessToken).m_id;

        let sql1 = `SELECT * FROM TBL_STORY WHERE S_NO = ? AND S_IS_DELETED = 0`;
        let sql2 = `SELECT * FROM TBL_STORY_PICTURE WHERE SP_OWNER_NO = ? AND SP_IS_DELETED = 0 ORDER BY SP_REG_DATE DESC`;
        let sql3 = `SELECT * FROM TBL_MEMBER WHERE M_ID = ?`;
        let sql4 = `SELECT COUNT(*) FROM TBL_STORY_LIKE WHERE SL_OWNER_STORY_NO = ? ORDER BY SL_REG_DATE DESC`;
        let sql5 = `SELECT SL_IS_LIKE FROM TBL_STORY_LIKE WHERE SL_OWNER_STORY_NO = ? AND SL_M_ID = ?`;
        let sql6 = `SELECT * FROM TBL_REPLY WHERE R_OWNER_STORY_NO = ? ORDER BY R_REG_DATE DESC`;
        
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

                                                        console.log('isLike: ', isLike);
                                                        if (isLike[0] !== undefined) {
                                                            story[0].storyIsLike = isLike[0]['SL_IS_LIKE'];
                                                            story[0].storyIsLike = isLike[0]['SL_IS_LIKE'];
            
                                                        } else {
                                                            story[0].storyIsLike = 0;

                                                        }
                                                            DB.query(sql6, story[0].S_NO, (error6, replys) => {
                                                                if (error6) {
                                                                    res.json(null);
                                                                    console.log('error6',error6);

                                                                } else {
                                                                    console.log('[story.S_NO]', story.S_NO);
                                                                    
                                                                        story[0].replysCnt = replys ? replys.length : 0;
                                                                        story[0].replys = replys? replys : '';
                                                                        console.log(story);
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

        let post = {
            's_txt' : '올때 메로나',
            's_is_public' : 1,
            's_no' : 1,
        }

        let curImg = ['a', 'b', 'c', 'd', 'e'];                         // req.body.curImg;
        let newImg = ['a', 'd', 'e', 'f', 'g', 'h', 'i'];               // req.file;

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);
        let connection3 = await pool.getConnection(async conn => conn);
        let connection4 = await pool.getConnection(async conn => conn);

        let sql1 = `UPDATE TBL_STORY SET S_TXT = ?, S_IS_PUBLIC = ?, S_MOD_DATE = NOW() WHERE S_NO = ?`;
        let sql2 = `UPDATE TBL_STORY_PICTURE SET SP_PICTURE_NAME = ? SP_MOD_DATE = NOW() WHERE SP_PICTURE_NAME = ?`;
        let sql3 = `UPDATE TBL_STORY_PICTURE SET SP_IS_DELETED = 1 SP_MOD_DATE = NOW() WHERE SP_PICTURE_NAME = ?`;
        let sql4 = `INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(?, ?)`;
        
        connection1.beginTransaction();
        connection2.beginTransaction();
        connection3.beginTransaction();
        connection4.beginTransaction();

        try {
            let modify1 = await connection1.query(sql1, [post.s_txt, post.s_is_public, post.s_no]);

            if (modify1[0].affectedRows > 0) {                  // modify1 이 성공했을 시

                try{

                    if (newImg.length <= curImg.length) {

                    for (let i = 0; i < curImg.length; i++) {       // curImg의 갯수만큼 밑의 작업 반복
                        // if (curImg[i].SP_PICTURE_NAME !== newImg[i].SP_PICTURE_NAME) {               // curImg[i]와 newImg[i]가 다른 경우
                        if (curImg[i] !== newImg[i]) {               // curImg[i]와 newImg[i]가 다른 경우
                            
                            try {
                            
                            // let modify2 = await connection2.query(sql2, [newImg[i].SP_PICTURE_NAME, curImg[i].SP_PICTURE_NO]);
                            let modify2 = await connection2.query(sql2, [newImg[i], curImg[i]]);

                            if (modify2[0].affectedRows > 0) {
                                console.log('modify2[0].affectedRows:', modify2[0].affectedRows);
                                connection1.commit();
                                connection2.commit();

                            } else {
                                connection1.rollback();
                                connection2.rollback();
                                res.json('modify2 error');

                            }

                            } catch (error2) {
                                connection1.rollback();
                                connection2.rollback();
                                connection3.rollback();
                                res.json('modify2 error');
                            }

                        // } else if (curImg[i].SP_PICTURE_NAME !== undefined && newImg[i].SP_PICTURE_NAME === undefined && newImg[i].SP_PICTURE_NAME === null && newImg[i].SP_PICTURE_NAME === '') {
                        } else if (curImg[i] !== undefined && newImg[i] === undefined && newImg[i] === null && newImg[i] === '') {
                            
                            try {

                                // let modify3 = await connection3.query(sql3, curImg[i].SP_PICTURE_NO);
                                let modify3 = await connection3.query(sql3, curImg[i]);

                                if (modify3[0].affectedRows > 0) {
                                    connection1.commit();
                                    connection2.commit();
                                    connection3.commit();

                                } else {
                                    connection1.rollback();
                                    connection2.rollback();
                                    connection2.rollback();
                                    res.json('modify3 error');

                                }

                            } catch (error3) {
                                connection1.rollback();
                                connection2.rollback();
                                connection2.rollback();
                                res.json('modify3 error');

                            }

                        }

                    }
                
                } else if (newImg.length > curImg.length) {

                    let addImgSample = newImg.filter((v, i) => i >= curImg.length);
                    let addImg = addImgSample.filter(v => !curImg.includes(v));
                    console.log('addImg', addImg);

                        try {

                            let completeModify4 = 0;

                            for (let i = 0; i < addImg.length; i++) {

                                let modify4 = await connection4.query(sql4, [post.s_no, addImg[i]]);
                                console.log('modify4: ', modify4);

                                if (modify4[0].affectedRows > 0) {
                                    connection1.commit();
                                    connection2.commit();
                                    connection3.commit();
                                    connection4.commit();
                                    completeModify4++;
                                    console.log('completeModify4: ', completeModify4);

                                    if (completeModify4 === addImg.length) 
                                    res.json('modify4 success');

                                } else {
                                    connection1.rollback();
                                    connection2.rollback();
                                    connection3.rollback();
                                    connection4.rollback();
                                    res.json('modify4 error');

                                }

                            }

                        } catch (error4) {
                            connection1.rollback();
                            connection2.rollback();
                            connection3.rollback();
                            connection4.rollback();
                            res.json('modify4 error');

                        }

                    }

                } catch (error2) {
                    connection1.rollback();
                    connection2.rollback();
                    connection3.rollback();
                    connection4.rollback();
                    res.json('modify2 error');

                }


            } else {
                connection1.rollback();
                connection2.rollback();
                connection3.rollback();
                connection4.rollback();
                res.json('modify1 error');

            }
            res.json('modify1 success');

        } catch (error1) {
            connection1.rollback();
            connection2.rollback();
            connection3.rollback();
            connection4.rollback();
            res.json('modify1 error');

        } finally {
            connection1.release();
            connection2.release();
            connection3.release();

        }
                    
    },

    /*
    // 스토리 수정 컨펌 (transaction 사용)
    modify_confirm : async function(req, res) {
        printLog(DEFAULT_NAME, 'modify_confirm');

        let arr1 = ['a', 'b', 'c', 'd', 'e'];   // 기존사진 // req.body.cur~~~
        let arr2 = ['b', 'e', 'f', 'g', 'h'];   // 변경한 사진 (사용자가 올린 사진) <- 여기에 기존 사진도 같이 담아갈지
        let arr3 = ['b', 'e'];                  // 기존에 있고 변경후에도 있는 사진


        /*
        // 더미 실험 START
        let delImg = ["del1", "del2", "del3", "del4"];

        const placeholders = delImg.map(() => '?').join(', ');
        console.log('placeholders: ' + placeholders);
        const query = `UPDATE TBL_STORY_PICTURE SET SP_IS_DELETED = 1 WHERE SP_PICTURE_NAME IN (${placeholders})`;

        console.log('query: ', query);

        DB.query(query, delImg, (error, result) => {
            if (error) {
                console.log('error', error);
                res.json(null);

            } else {
                res.send({result});

            }

        })
        // 더미 실험 END
        

        // del = a,c,d      <- 삭제할 사진
        // cur = b,e        <- 기존에 있고 변경후에도 있는 사진
        // add = f,g,h      <- 추가할 사진

        // 기존 사진의 파일명들이 배열로 들어옴, 추가할 사진은 req.file로 들어옴! 삭제할 사진은 기존에 있던 리스트를 백으로 다시 보내달라고 요청하기.
        // 필요한건 1. 삭제할 사진들(req.body), 2. 추가할 사진들(req.file) 3. 기존에 있고 변경후에도 있는 사진 <- 프론트에 요청하기!
        // b,e = 프론트에서 던짐 / f,g,h = (req.file) / DB 갔다오는것 보단 프론트에서 
        // 기존 사진 배열로 만들어서 던지고, 남길것, 삭제할것 따로 따로 body에 담아서 던져주세요!

        let curImg = req.body.curImg;
        let addImg = req.file;
        
        // let delImg = ["del1", "del2", "del3", "del4"];
        // let addImg = ["add1", "add2", "add3", "add4"];
        let post = {
            's_txt' : '올때 메로나',
            's_is_public' : 1,
            's_no' : 1,
        }

        console.log('post', post);

        /*
        const placeholders = delImg.map(() => '?').join(', ');
        console.log('placeholders: ' + placeholders);
        /*
        let del = arr1.filter(v =>!arr3.includes(v));
        // let add = arr2.filter(v => arr1.includes(v));
        let add = arr2.filter(v => !arr1.includes(v));      // 굳이 필터돌릴필요 X | req.file에서 꺼내면 add된 사진만 나옴
        console.log('del: ', del);
        console.log('add: ', add);
        

        let sql1 = `UPDATE TBL_STORY SET S_TXT = ?, S_IS_PUBLIC = ?, S_MOD_DATE = NOW() WHERE S_NO = ?`;    // cnt로 사진이름 검색해서 1이면 안들어가게, 0이면 들어가게!!
        let sql2 = `UPDATE TBL_STORY_PICTURE SET SP_IS_DELETED = 1 WHERE SP_PICTURE_NAME IN (${placeholders})`;   // 배열의 길이만큼 SP_PICTURE_NAME 추가, DELETE할 사진이 없으면 실행이 안돼야 함.
        // let sql2 = `UPDATE TBL_STORY_PICTURE SET SP_IS_DELETED = 1 WHERE SP_PICTURE_NAME = ?`;              
        let sql3 = `INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(?, ?)`;              // 추가되는 사진 INSERT하는 쿼리.
        
        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);
        let connection3 = await pool.getConnection(async conn => conn);
        
        connection1.beginTransaction();
        connection2.beginTransaction();
        connection3.beginTransaction();

        try {

            let modify1 = await connection1.query(sql1, [post.s_txt, post.s_is_public, post.s_no]);
            if (modify1[0].affectedRows > 0) {          // modify1 이 성공했을 경우!
                
                try {

                } catch (error2) {
                    connection1.rollback();
                    connection2.rollback();
                    connection3.rollback();
                    res.json(null);

                }


            } else {                                    // modify1 이 실패했을 경우
                connection1.rollback();
                res.json(null);

            }

            res.json('modify1[0].affectedRows: ', modify1[0].affectedRows);

        } catch (error1) {
            connection1.rollback();
            connection2.rollback();
            connection3.rollback();
            res.json(null);

        } finally {
            connection1.release();
            connection2.release();
            connection3.release();

        }
        
                    
    },
    */

    // 스토리 삭제 컨펌 (transaction 사용)
    delete_confirm: async function(req, res) {
        printLog(DEFAULT_NAME, 'delete_confirm');

        let s_no = 1;         // req.body.s_no

        let connection1 = await pool.getConnection(async conn => conn);
        let connection2 = await pool.getConnection(async conn => conn);
        let connection3 = await pool.getConnection(async conn => conn);

        let sql1 = `UPDATE TBL_STORY SET S_IS_DELETED = 1 WHERE S_NO = ?`;
        let sql2 = `UPDATE TBL_STORY_PICTURE SET SP_IS_DELETED = 1 WHERE SP_OWNER_NO = ?`;
        let sql3 = `UPDATE TBL_REPLY SET R_IS_DELETED = 1 WHERE R_OWNER_STORY_NO = ?`;

        connection1.beginTransaction();
        connection2.beginTransaction();
        connection3.beginTransaction();

        try {

            let delete1 = await connection1.query(sql1, [s_no]);
            
            if (delete1[0].affectedRows > 0) {

                try {

                    let delete2 = await connection2.query(sql2, [s_no]);
                    
                    if (delete2[0].affectedRows > 0) {

                        try {
                        
                            let delete3 = await connection3.query(sql3, [s_no]);

                            if (delete3[0].affectedRows > 0) {
                                connection1.commit();
                                connection2.commit();
                                connection3.commit();

                            } else {
                                connection1.rollback();
                                connection2.rollback();
                                connection3.rollback();
                                res.json(null);

                            }
                        } catch (error3) {
                            connection1.rollback();
                            connection2.rollback();
                            connection3.rollback();
                            res.json(null);
                            
                        }

                    } else {
                        connection1.rollback();
                        connection2.rollback();
                        connection3.rollback();
                        res.json(null);

                    }
                    
                } catch (error2) {
                    connection1.rollback();
                    connection2.rollback();
                    connection3.rollback();
                    res.json(null);

                }

        } else {
            connection1.rollback();
            connection2.rollback();
            connection3.rollback();
            res.json(null);

        }
        
        res.json('delete1[0].affectedRows: ' + delete1[0].affectedRows);
        
        } catch (error) {
            console.log('error', error);
            connection1.rollback();
            connection2.rollback();
            connection3.rollback();
            res.json(null);

        } finally {
            connection1.release();
            connection2.release();
            connection3.release();

        }

    },

}

module.exports = storyService;
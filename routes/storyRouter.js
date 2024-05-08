const express = require('express');
const storyRouter = express.Router();
const replyRouter = express.Router();
const storyService = require('../lib/service/storyService');
const replyService = require('../lib/service/replyService');
const multer = require('multer');
const uuid4 = require('uuid4');
const path = require('path');
const { printLog } = require('../lib/utils/logger');
const uploads = require('../lib/utils/uploads');
const pictureUploadMiddleware = uploads.pictureUpload.array('images', 10);
const DEV_PROD_VARIABLE = require("../lib/config/config");

const DAFAULT_NAME = 'storyRouter';

// --------------------------------- 스토리 router START --------------------------------------- //

// 파일 업로드
/*
const upload = multer({
    storage : multer.diskStorage({
        destination(req, file, done) {
            done(null, 'D:\\LSY\\Programming\\8_node_js\\pjt\\jujubeProject\\story_pic')
            // `/home/ubuntu/member/upload/profile_thums/${req.body.m_id}/`
        },
        filename(req, file, done) {
            console.log('file', file);
            let uuid = uuid4();
            let extname = path.extname(file.originalname);
            var filename = uuid + extname;
            done(null, filename);
        }
    }),
    limits : {
        fileSize : 1024 * 1024
    }
});

const uploadMiddleware = upload.array('sp_picture_name', 10);
*/


// 스토리 작성 컨펌

/*
storyRouter.get('/write_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/story/write_confirm');
    storyService. write_confirm(req, res);

});
*/

storyRouter.post('/write_confirm', pictureUploadMiddleware, (req, res) => {
    printLog(DAFAULT_NAME, '/write_confirm');

    const post = req.body;

    console.log('post---', post);
    console.log('req', req);

    // const fileCount = req.body[2].length; //넘어온 이미지 갯수
    // const timeStamp = new Date();
    
    // for (let i = 0; i < fileCount; i++) {
    //     const imgPathTemp = `C:\\jujube\\upload\\profile_thums\\`;
    //     let fileName = imgPathTemp + "_" + timeStamp + "_" + i + ".jpg";

    //     /*이미지 저장 */
    //     fs.writeFileSync(fileName, req.body.sendImgs[i].replace(/^data:image\/jpeg;base64,/, ""), "base64");

    // }

    // storyService.write_confirm(req, res);

});


// 나 + 친구들의 모든 스토리 가져오기(홈 => 피드에 보이는 것)
storyRouter.get('/get_all_storys', (req, res) => {
    printLog(DAFAULT_NAME, '/story/get_all_storys');
    storyService.get_all_storys(req, res);

});

// 내 모든 스토리 가져오기 (내 피드에서 보이는 것)
storyRouter.get('/get_my_storys', (req, res) => {
    printLog(DAFAULT_NAME, '/story/get_my_storys');
    storyService.get_my_storys(req, res);

});

// // 스토리 한개 가져오기 (modify용)
storyRouter.get('/get_story', (req, res) => {
    printLog(DAFAULT_NAME, '/story/get_story');
    storyService.get_story(req, res);

});


// 스토리 수정 컨펌
storyRouter.get('/modify_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/story/modify_confirm');
    storyService.modify_confirm(req, res);

});

/*
storyRouter.post('/modify_confirm', pictureUploadMiddleware, (req, res) => {
    printLog(DAFAULT_NAME, '/modify_confirm');
    storyService.modifyConfirm(req, res);

});
*/

// 스토리 삭제 컨펌
storyRouter.get('/delete_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/story/delete_confirm');
    storyService.delete_confirm(req, res);
    
});

// --------------------------------- 스토리 router END --------------------------------------- //


// --------------------------------- 댓글 router START --------------------------------------- //
// 댓글 등록 컨펌
replyRouter.get('/reply_write_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/reply/reply_write_confirm');
    replyService.reply_write_confirm(req, res);

});

/*
replyRouter.post('/write_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/reply/write_confirm');
    replyService.writeConfirm(req, res);

});
*/

// 스토리에 대한 댓글 가져오기
replyRouter.get('/get_replys', (req, res) => {
    printLog(DAFAULT_NAME, '/reply/get_replys');
    replyService.get_replys(req, res);

});

// 댓글 한개에 대한 대댓글 가져오기
replyRouter.get('/get_re_replys', (req, res) => {
    printLog(DAFAULT_NAME, '/reply/get_re_replys');
    replyService.get_re_replys(req, res);

});

// 댓글 수정 컨펌
replyRouter.get('/modify_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/reply/modify_confirm');
    replyService.modifyConfirm(req, res);

});

// 댓글 삭제 컨펌
/*
replyRouter.get('/delete_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/reply/delete_confirm');
    replyService.deleteConfirm(req, res);
    
});
*/






// --------------------------------- 댓글 router END --------------------------------------- //


module.exports = {storyRouter, replyRouter};
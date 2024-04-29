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
const pictureUploadMiddleware = uploads.pictureUpload.array('sp_picture_name', 10);
const DEV_PROD_VARIABLE = require("../lib/config/config");

const DAFAULT_NAME = '[storyRouter]';

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
storyRouter.get('/write_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/story/write_confirm');
    storyService. writeConfirm(req, res);

});
/*
storyRouter.post('/write_confirm', pictureUploadMiddleware, (req, res) => {
    printLog(DAFAULT_NAME, '/write_confirm');
    storyService.writeConfirm(req, res);

});
*/

// 스토리 가져오기
storyRouter.get('/get_story', (req, res) => {
    printLog(DAFAULT_NAME, '/story/get_story');
    storyService.getStory(req, res);

});

// 스토리 수정 컨펌
storyRouter.get('/modify_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/story/modify_confirm');
    storyService.modifyConfirm(req, res);

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
    storyService.deleteConfirm(req, res);
    
});

// --------------------------------- 스토리 router END --------------------------------------- //


// --------------------------------- 댓글 router START --------------------------------------- //
// 댓글 등록 컨펌
replyRouter.get('/write_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/reply/write_confirm');
    replyService.writeConfirm(req, res);

});

/*
replyRouter.post('/write_confirm', (req, res) => {
    printLog(DAFAULT_NAME, '/reply/write_confirm');
    replyService.writeConfirm(req, res);

});
*/

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






// --------------------------------- 댓글 router START --------------------------------------- //


module.exports = {storyRouter: storyRouter, replyRouter: replyRouter};
// module.exports = replyRouter;
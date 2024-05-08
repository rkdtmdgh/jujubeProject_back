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
const pictureUploadMiddleware = uploads.pictureUpload.array('files', 10);
const DEV_PROD_VARIABLE = require("../lib/config/config");
const sharp = require('sharp');
const fs = require('fs');
const Jimp = require('jimp');

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

    try {

        for (let i = 0; i < req.files.length; i++) {
            Jimp.read(req.files[i].path)
                .then((image) => {

                    const maxWidth = 400; // 가로 너비 최대값
                    const maxHeight = 400; // 세로 높이 최대값
                
                    let width, height;
                
                    // 가로 너비를 400픽셀로 고정하고 세로 높이를 원본 비율에 맞춰 계산
                    width = maxWidth;
                    height = image.bitmap.height * (width / image.bitmap.width);
                
                    // 세로 높이가 400픽셀을 초과하면 세로 높이를 400픽셀로 고정하고 가로 너비를 원본 비율에 맞춰 계산
                    if (height > maxHeight) {
                        height = maxHeight;
                        width = image.bitmap.width * (height / image.bitmap.height);
                    }

                    image
                        .resize(width, height)
                        .quality(80)
                        .write(req.files[i].path)
                })
            }
        
        let destination = req.files[0].destination;
        let lastFolderName = destination.split('\\');
        let savedDir = lastFolderName[lastFolderName.length - 2]

        storyService.write_confirm(req, res, savedDir);

        /*
        sharp(req.files[0].path)   // 압축할 이미지 경로
            .resize({ width: 400 })     // 비율 유지하며 가로 크기 400으로 줄이기
            .withMetadata()         // 이미지의 exif(방향 정보) 정보를 유지

            .toBuffer()
            .then((buffer) => {

                fs.writeFile(req.files[0].path, buffer, (err) => {
                    if (err) {
                        printLog(DAFAULT_NAME, '/write_confirm sharp writeFile error', err);
                        
                    } else {
                        printLog(DAFAULT_NAME, '/write_confirm sharp writeFile success');
                        
                    }
                })

            })
        */

    } catch (error) {
        printLog(DAFAULT_NAME, '/write_confirm sharp error', error);
    }


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






// --------------------------------- 댓글 router END --------------------------------------- //


module.exports = {storyRouter, replyRouter};
const express = require('express');
const Jimp = require('jimp');
const app = express();
const router = express.Router();
const memberService = require('../lib/service/memberService');
const { printLog } = require('../lib/utils/logger');
const uploads = require('../lib/utils/uploads');
const { authAcceccToken, getAccessToken } = require('../lib/middleware/authorization');
const singleUploadMiddleware = uploads.profileUpload.single('m_profile_thumbnail');

const DEFAULT_NAME = '[memberRouter]';

// app.use(singleUploadMiddleware);

// 로컬 회원 가입 확인
router.post('/sign_up_confirm', singleUploadMiddleware, (req, res) => {
    printLog(DEFAULT_NAME, '/sign_up_confirm');

    try {

        if(req.file.path === undefined) return;

        Jimp.read(req.file.path)
            .then((image) => {
                const maxWidth = 150; // 가로 너비 최대값
                const maxHeight = 150; // 세로 높이 최대값
            
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
                    .write(req.file.path)

            })

    } catch (error) {
        printLog(DEFAULT_NAME, '/sign_up_confirm jimp error', error);

    } finally {
        memberService.sign_up_confirm(req, res);

    }

})

// 로그인 확인
router.post('/sign_in_confirm', (req, res) => {
    printLog(DEFAULT_NAME, '/sign_in_confirm');

    memberService.sign_in_confirm(req, res);

})

// 구글 로그인 확인
router.post('/google_sign_in_confirm', (req, res) => {
    printLog(DEFAULT_NAME, '/google_sign_in_confirm');

    memberService.google_sign_in_confirm(req, res);

})


// 회원 정보 가져오기
router.get('/get_member', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/get_member');

    memberService.get_member(req, res);

})

// 입력 회원 정보 가져오기
router.get('/get_search_member', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/get_search_member');

    memberService.get_search_member(req, res);

})

// 정보 수정 확인
router.post('/modify_confirm', authAcceccToken, singleUploadMiddleware, (req, res) => {
    printLog(DEFAULT_NAME, '/modify_confirm');

    try {

        if (req.file === undefined || req.file === null) return;

        Jimp.read(req.file.path)
        .then((image) => {
            const maxWidth = 150; // 가로 너비 최대값
            const maxHeight = 150; // 세로 높이 최대값
        
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
                .write(req.file.path)

        })

    } catch (error) {
        printLog(DEFAULT_NAME, '/modify_confirm jimp error', error);

    } finally {
        memberService.modify_confirm(req, res);

    }

})

// 로그아웃 확인
router.get('/sign_out_confirm', (req, res) => {
    printLog(DEFAULT_NAME, '/sign_out_confirm');

    memberService.sign_out_confirm(req, res);

})

// 회원 탈퇴 확인
router.get('/delete_confirm', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/delete_confirm');

    memberService.delete_confirm(req, res);

})

// 친구 요청 유무 확인
router.get('/friend_request_status', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/friend_request_status');

    memberService.friend_request_status(req, res);

});

// 친구 요청
router.post('/friend_request', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/friend_request');

    memberService.friend_request(req, res);

})

// 내가 한 친구 요청 취소
router.post('/friend_request_cancel', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/friend_request_cancel');

    memberService.friend_request_cancle(req, res);

});

// 내가 받은 친구 요청 거절
router.delete('/friend_request_reject', authAcceccToken , (req, res) => {
    printLog(DEFAULT_NAME, '/friend_request_reject');

    memberService.friend_request_reject(req, res);

})

// 친구 요청 수락 test
router.post('/friend_request_confirm', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/friend_request_confirm');

    memberService.friend_request_confirm(req, res);

})


// 친구 요청 수락

router.post('/friend_request_confirm', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/friend_request_confirm');

    memberService.friend_confirm(req, res);

})


// 친구 삭제
router.post('/friend_delete_confirm', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/friend_delete_confirm');

    memberService.friend_delete_confirm(req, res);

})

// 친구 수 카운트
router.get('/get_friend_count', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/friend_count');

    memberService.get_friend_count(req, res);

})

// 친구 목록 가져오기
router.get('/get_friend_list', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/friend_list');

    memberService.get_friend_list(req, res);

})

// 친구 신청 목록 가져오기
router.get('/get_friend_request_list', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/friend_request_list');

    memberService.get_friend_request_list(req, res);

})

// 친구 유무 확인.
router.post('/get_friend_status', authAcceccToken, (req, res) => {
    printLog(DEFAULT_NAME, '/get_friend_status');

    memberService.get_friend_status(req, res);

})


module.exports = router;
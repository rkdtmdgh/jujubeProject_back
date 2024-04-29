const express = require('express');
const app = express();
const router = express.Router();
const memberService = require('../lib/service/memberService');
const { printLog } = require('../lib/utils/logger');
const uploads = require('../lib/utils/uploads');
const singleUploadMiddleware = uploads.profileUpload.single('m_profile_thumbnail');

const DEFAULT_NAME = '[memberRouter]';

app.use(singleUploadMiddleware);

// 로컬 회원 가입 확인
router.post('/sign_up_confirm', singleUploadMiddleware, (req, res) => {
    printLog(DEFAULT_NAME, '/sign_up_confirm');

    memberService.sign_up_confirm(req, res);

})

// 회원 정보 가져오기
router.get('/get_member', (req, res) => {
    printLog(DEFAULT_NAME, '/get_member');

    memberService.get_member(req, res);

})

// 정보 수정 확인
router.get('/modify_confirm', (req, res) => {
    printLog(DEFAULT_NAME, '/modify_confirm');

    memberService.modify_confirm(req, res);

})

// 로그아웃 확인
router.get('/sign_out_confirm', (req, res) => {
    printLog(DEFAULT_NAME, '/sign_out_confirm');

    memberService.sign_out_confirm(req, res);

})

// 회원 탈퇴 확인
router.get('/delete_confirm', (req, res) => {
    printLog(DEFAULT_NAME, '/delete_confirm');

    memberService.delete_confirm(req, res);

})

// 친구 요청
router.get('/friend_request', (req, res) => {
    printLog(DEFAULT_NAME, '/friend_request');

    memberService.friend_request(req, res);

})

// 친구 요청 수락
router.post('/friend_confirm', (req, res) => {
    printLog(DEFAULT_NAME, '/friend_confirm');

    memberService.friend_confirm(req, res);

})

// 친구 삭제
router.post('/friend_delete_confirm', (req, res) => {
    printLog(DEFAULT_NAME, '/friend_delete_confirm');

    memberService.friend_delete_confirm(req, res);

})

module.exports = router;
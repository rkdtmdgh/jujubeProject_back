const express = require('express');
const app = express();
const router = express.Router();
const memberService = require('../lib/service/memberService');
const { printLog } = require('../lib/utils/logger');
const uploads = require('../lib/utils/uploads');
const jwt = require("jsonwebtoken");
const singleUploadMiddleware = uploads.profileUpload.single('m_profile_thumbnail');

let pp = require('../lib/passport/passport.js');

const DEFAULT_NAME = '[memberRouter]';

let passport = pp.passport(app);

app.use(singleUploadMiddleware);

// 로컬 회원 가입 확인
router.post('/sign_up_confirm', singleUploadMiddleware, (req, res) => {
    printLog(DEFAULT_NAME, '/sign_up_confirm');

    console.log('req.file====', req.file);

    memberService.sign_up_confirm(req, res);

})

// 로그인 확인
router.post('/sign_in_confirm', (req, res) => {
    printLog(DEFAULT_NAME, '/sign_in_confirm');

    memberService.sign_in_confirm(req, res);

})

// 구글 로그인 확인
// router.post('/google_sign_in_confirm', (req, res) => {
//     printLog(DEFAULT_NAME, '/google_sign_in_confirm');

//     memberService.google_sign_in_confirm(req, res);

// })

// 로그인 성공
router.get('/sign_in_success', (req, res) => {
    printLog(DEFAULT_NAME, '/sign_in_success');

    memberService.sign_in_success(req, res);

})

// 로그인 실패
router.get('/sign_in_fail', (req, res) => {
    printLog(DEFAULT_NAME, '/sign_in_fail');

    memberService.sign_in_fail(req, res);

})

// 회원 정보 가져오기
router.get('/get_member', (req, res) => {
    printLog(DEFAULT_NAME, '/get_member');

    memberService.get_member(req, res);

})

// 입력 회원 정보 가져오기
router.get('/get_search_member', 
    // passport.authenticate('jwt', { session: false }), 
    (req, res) => {
    printLog(DEFAULT_NAME, '/get_search_member');

    memberService.get_search_member(req, res);

})

// 정보 수정 확인
router.post('/modify_confirm', singleUploadMiddleware, (req, res) => {
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

// 친구 수 카운트
router.get('/get_friend_count', (req, res) => {
    printLog(DEFAULT_NAME, '/friend_count');

    memberService.get_friend_count(req, res);

})

// 친구 목록 가져오기
router.get('/get_friend_list', (req, res) => {
    printLog(DEFAULT_NAME, '/friend_list');

    memberService.get_friend_list(req, res);

})


module.exports = router;
-- DB_JUJUBE
CREATE DATABASE DB_JUJUBE;
USE DB_JUJUBE;

-- 멤버 테이블 -------------------------------------------
CREATE TABLE TBL_MEMBER(
	M_NO INT AUTO_INCREMENT,                  -- 멤버 NO
	M_ID VARCHAR(20) NOT NULL UNIQUE,           -- 멤버 ID
	M_PW VARCHAR(100) NOT NULL,                  -- 멤버 PW
	M_NAME VARCHAR(20) NOT NULL,               -- 멤버 이름
	M_MAIL VARCHAR(30) NOT NULL,               -- 멤버 메일
	M_PHONE VARCHAR(30)   NOT NULL,               -- 멤버 연락처
	M_GENDER CHAR(1) NOT NULL,                  -- 멤버 성별(M or F)
	M_SELF_INTRODUCTION   VARCHAR(100),            -- 멤버 자기소개
	M_PROFILE_THUMBNAIL   VARCHAR(100),            -- 멤버 대표이미지(이미지파일 이름)
	M_IS_DELETED TINYINT DEFAULT 0,               -- 멤버 삭제 유무 (0: 안지움. 1: 지움)
	M_DELETED_DATE DATETIME,                  -- 멤버 삭제 날짜
	M_IS_SUSPEND TINYINT DEFAULT 0,               -- 멤버 정지 유무 (0: 정지아님. 1: 정지)
	M_SUSPEND_DATE DATETIME,                  -- 멤버 정지 날짜
	M_SUSPEND_REASON VARCHAR(50),               -- 멤버 삭제 사유
    M_GOOGLE_ID VARCHAR(30),                  -- 멤버 구글 ID (PASSPORT-GOOGLE-AUTHOR 로그인 시)
	M_REG_DATE DATETIME DEFAULT NOW(),            -- 멤버 등록일
	M_MOD_DATE DATETIME DEFAULT NOW(),            -- 멤버 수정일
    PRIMARY KEY(M_NO)
);

SELECT * FROM TBL_MEMBER;
DELETE FROM TBL_MEMBER;
DROP TABLE TBL_MEMBER;
-- ---------------------------------------------------------



-- 관리자 테이블 -------------------------------------------
CREATE TABLE TBL_ADMIN(
	A_NO INT AUTO_INCREMENT,                  -- 관리자 NO
	A_ID VARCHAR(20) NOT NULL,                  -- 관리자 ID
	A_PW VARCHAR(100) NOT NULL,                  -- 관리자 PW
	A_NAME VARCHAR(20) NOT NULL,               -- 관리자 이름
	A_MAIL VARCHAR(30) NOT NULL,               -- 관리자 메일
	A_PHONE VARCHAR(30) NOT NULL,               -- 관리자 연락처
	A_REG_DATE DATETIME DEFAULT NOW(),            -- 관리자 등록일
	A_MOD_DATE DATETIME DEFAULT NOW(),            -- 관리자 수정일
    PRIMARY KEY(A_NO)
);

SELECT * FROM TBL_ADMIN;
DELETE FROM TBL_ADMIN;
DROP TABLE TBL_ADMIN;
-- --------------------------------------------------------


-- 게시물 테이블 ------------------------------------------
CREATE TABLE TBL_STORY(
	S_NO INT AUTO_INCREMENT,                  -- 게시물 NO
	S_OWNER_ID VARCHAR(20) NOT NULL,            -- 게시물 작성자 ID (TBL_MEMBER -> M_ID)
	S_TXT VARCHAR(200),                        -- 게시물 내용
	S_IS_PUBLIC TINYINT NOT NULL,               -- 게시물 공개여부 (0: 모두공개 / 1: 친구공개 / -1 : 비공개(나만보기))
	S_IS_DELETED TINYINT DEFAULT 0,               -- 게시물 삭제여부 (0: 안지움 / 1: 지움)
	S_DELETD_DATE DATETIME,                     -- 게시물 삭제 날짜
	S_REG_DATE DATETIME DEFAULT NOW(),            -- 게시물 등록일
	S_MOD_DATE DATETIME DEFAULT NOW(),            -- 게시물 수정일
    PRIMARY KEY(S_NO)
);

SELECT * FROM TBL_STORY;
DELETE FROM TBL_STORY;
DROP TABLE TBL_STORY;
-- --------------------------------------------------------


-- 게시물 사진 테이블 -------------------------------------
CREATE TABLE TBL_STORY_PICTURE(
	SP_NO INT AUTO_INCREMENT,                  -- 게시물 사진 NO
	SP_OWNER_NO INT NOT NULL,                  -- 게시물 사진의 게시물NO (TBL_STORY -> S_NO)
	SP_PICTURE_NAME VARCHAR(100) NOT NULL,         -- 게시물 사진(이미지파일 이름)
	SP_IS_DELETED TINYINT DEFAULT 0,            -- 게시물 삭제여부 (0: 안지움 / 1: 지움)
	SP_DELETD_DATE DATETIME,                  -- 게시물 삭제 날짜
	SP_REG_DATE DATETIME DEFAULT NOW(),            -- 게시물 등록일
	SP_MOD_DATE DATETIME DEFAULT NOW(),            -- 게시물 수정일
    PRIMARY KEY(SP_NO)
);

SELECT * FROM TBL_STORY_PICTURE;
DELETE FROM TBL_STORY_PICTURE;
DROP TABLE TBL_STORY_PICTURE;
-- --------------------------------------------------------



-- 게시물 좋아요 테이블 -----------------------------------
CREATE TABLE TBL_STORY_LIKE(
	SL_NO INT AUTO_INCREMENT,                  -- 게시물 좋아요 NO
	SL_OWNER_STORY_NO INT NOT NULL,               -- 좋아요 누른 게시물 NO (TBL_STORY -> S_NO)
	SL_M_ID VARCHAR(20) NOT NULL,               -- 게시물 좋아요 누른 사람 ID (TBL_MEMBER -> M_ID)
	SL_IS_LIKE TINYINT DEFAULT 1,               -- 게시물 좋아요 여부 (1: 좋아요 / 0: 좋아요 취소)
	SL_REG_DATE DATETIME DEFAULT NOW(),            -- 게시물 좋아요 등록일
	SL_MOD_DATE DATETIME DEFAULT NOW(),            -- 게시물 좋아요 수정일
    PRIMARY KEY(SL_NO)
);

SELECT * FROM TBL_STORY_LIKE;
DELETE FROM TBL_STORY_LIKE;
DROP TABLE TBL_STORY_LIKE;
-- --------------------------------------------------------


-- 댓글 테이블 --------------------------------------------
CREATE TABLE TBL_REPLY(
	R_NO INT AUTO_INCREMENT,                  -- 댓글 NO
	R_ORGIN_NO INT NOT NULL,                  -- 초기 댓글 NO
	R_OWNER_STORY_NO INT NOT NULL,               -- 댓글 단 게시물 NO (TBL_STORY -> S_NO)
	R_TXT VARCHAR(50),                        -- 댓글 내용
	R_CLASS TINYINT DEFAULT 0,                  -- 대댓글 여부 (0: 일반댓글 / 1: 대댓글)
    R_M_ID VARCHAR(20) NOT NULL,               -- 댓글 작성자 ID (TBL_MEMBER -> M_ID)
    R_REG_DATE DATETIME DEFAULT NOW(),            -- 댓글 등록일
	R_MOD_DATE DATETIME DEFAULT NOW(),            -- 댓글 수정일
    PRIMARY KEY(R_NO)
);

SELECT * FROM TBL_REPLY;
DELETE FROM TBL_REPLY;
DROP TABLE TBL_REPLY;
-- --------------------------------------------------------


-- 댓글 좋아요 테이블 -------------------------------------
CREATE TABLE TBL_REPLY_LIKE(
	RL_NO INT AUTO_INCREMENT,                  -- 댓글 좋아요 NO
	RL_OWNER_STORY_NO INT NOT NULL,               -- 댓글 좋아요 누른 게시물 NO (TBL_STORY -> S_NO)
    RL_M_ID VARCHAR(20) NOT NULL,               -- 댓글 좋아요 누른 사람 ID (TBL_MEMBER -> M_ID)
    RL_IS_LIKE TINYINT DEFAULT 1,               -- 댓글 좋아요 여부 (1 : 좋아요 / 0 : 좋아요 취소)
    RL_REG_DATE DATETIME DEFAULT NOW(),            -- 댓글 좋아요 등록일
	RL_MOD_DATE DATETIME DEFAULT NOW(),            -- 댓글 좋아요 수정일
    PRIMARY KEY(RL_NO)
);

SELECT * FROM TBL_REPLY_LIKE;
DELETE FROM TBL_REPLY_LIKE;
DROP TABLE TBL_REPLY_LIKE;
-- --------------------------------------------------------


-- 친구 요청 테이블 ---------------------------------------
CREATE TABLE TBL_FRIEND_REQUEST(
	FR_NO INT AUTO_INCREMENT,                  -- 친구 요청 NO
	FR_REQ_ID VARCHAR(20) NOT NULL,               -- 친구 신청 하는 사람 ID
    FR_RES_ID VARCHAR(20) NOT NULL,               -- 친구 신청 받는 사람 ID
    FR_ILCHON_NAME VARCHAR(20) NOT NULL,         -- 친구 신청하는 사람이 설정한 친구 신청 받는사람의 일촌명
    FR_IS_ACCEPT TINYINT DEFAULT 0,               -- 친구 수락 여부 (0 : 수락전 / 1 : 수락후. 수락되면 친구테이블업데이트)
	FR_REG_DATE DATETIME DEFAULT NOW(),            -- 댓글 좋아요 수정일
    FR_MOD_DATE DATETIME DEFAULT NOW(),            -- 댓글 좋아요 수정일
    PRIMARY KEY(FR_NO)
);

SELECT * FROM TBL_FRIEND_REQUEST;
DELETE FROM TBL_FRIEND_REQUEST;
DROP TABLE TBL_FRIEND_REQUEST;
-- --------------------------------------------------------


-- 친구 테이블 --------------------------------------------
CREATE TABLE TBL_FRIEND(
	F_NO INT AUTO_INCREMENT,                  -- 친구 NO
    F_OWNER_ID VARCHAR(20) NOT NULL,   			-- 주인 ID
	F_ID VARCHAR(20) NOT NULL,                  -- 주인 친구 ID
    F_ILCHON_NAME VARCHAR(20) NOT NULL,            -- 친구(F_ID)의 일촌명. 주인에게 보여지는 친구 ID.
    F_IS_BLOCK TINYINT DEFAULT 0,               -- 친구 차단 여부(0 : 차단 안함 / 1 : 차단함). 주인이 친구를 차단.
	F_REG_DATE DATETIME DEFAULT NOW(),            -- 댓글 좋아요 수정일
    F_MOD_DATE DATETIME DEFAULT NOW(),            -- 댓글 좋아요 수정일
    PRIMARY KEY(F_NO)
);

SELECT * FROM TBL_FRIEND;
DELETE FROM TBL_FRIEND;
DROP TABLE TBL_FRIEND;



-- --------------------------------------------------------

-- 신고 테이블 미구현(구현 여부 미정)----------------------

-- --------------------------------------------------------


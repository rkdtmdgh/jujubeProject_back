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

ALTER TABLE TBL_MEMBER MODIFY COLUMN M_ID VARCHAR(20) NOT NULL UNIQUE;

SHOW INDEX FROM TBL_MEMBER;

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

SHOW INDEX FROM TBL_ADMIN;
-- --------------------------------------------------------


-- 게시물 테이블 ------------------------------------------
CREATE TABLE TBL_STORY(
	S_NO INT AUTO_INCREMENT,                  -- 게시물 NO
	S_OWNER_ID VARCHAR(20) NOT NULL,            -- 게시물 작성자 ID (TBL_MEMBER -> M_ID)
	S_TXT VARCHAR(200),                        -- 게시물 내용
	S_IS_PUBLIC TINYINT NOT NULL,               -- 게시물 공개여부 (0: 모두공개 / 1: 친구공개 / -1 : 비공개(나만보기))
	S_IS_DELETED TINYINT DEFAULT 0,               -- 게시물 삭제여부 (0: 안지움 / 1: 지움)
	S_DELETED_DATE DATETIME,                     -- 게시물 삭제 날짜
	S_REG_DATE DATETIME DEFAULT NOW(),            -- 게시물 등록일
	S_MOD_DATE DATETIME DEFAULT NOW(),            -- 게시물 수정일
    PRIMARY KEY(S_NO)
);

SELECT * FROM TBL_STORY;
DELETE FROM TBL_STORY;
DROP TABLE TBL_STORY;

ALTER TABLE TBL_STORY CHANGE S_DELETD_DATE S_DELETED_DATE DATETIME;

CREATE INDEX S_OWNER_ID ON TBL_STORY (S_OWNER_ID ASC);

INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('gildong', 'test1', 0);
INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('gildong', 'test2', 0);
INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('gildong', 'test3', 0);

INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('chanho', 'test1', 0);
INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('chanho', 'test2', 0);
INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('chanho', 'test3', 0);

INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('seari', 'test1', 0);
INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('seari', 'test2', 0);
INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('seari', 'test3', 0);

INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('hihi', 'test1', 0);
INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('hihi', 'test2', 0);
INSERT INTO TBL_STORY(S_OWNER_ID, S_TXT, S_IS_PUBLIC) VALUES('hihi', 'test3', 0);

SHOW INDEX FROM TBL_STORY;
-- --------------------------------------------------------
SELECT * FROM TBL_STORY WHERE S_OWNER_ID = 'seari' AND S_IS_DELETED = 0 AND (S_IS_PUBLIC = 0 OR S_IS_PUBLIC = 1) ORDER BY S_REG_DATE DESC;

-- 게시물 사진 테이블 -------------------------------------
CREATE TABLE TBL_STORY_PICTURE(
	SP_NO INT AUTO_INCREMENT,                  -- 게시물 사진 NO
	SP_OWNER_NO INT NOT NULL,                  -- 게시물 사진의 게시물NO (TBL_STORY -> S_NO)
	SP_PICTURE_NAME VARCHAR(100) NOT NULL,         -- 게시물 사진(이미지파일 이름)
	SP_IS_DELETED TINYINT DEFAULT 0,            -- 게시물 삭제여부 (0: 안지움 / 1: 지움)
	SP_DELETED_DATE DATETIME,                  -- 게시물 삭제 날짜
	SP_REG_DATE DATETIME DEFAULT NOW(),            -- 게시물 등록일
	SP_MOD_DATE DATETIME DEFAULT NOW(),            -- 게시물 수정일
    PRIMARY KEY(SP_NO)
);

SELECT * FROM TBL_STORY_PICTURE;
DELETE FROM TBL_STORY_PICTURE;
DROP TABLE TBL_STORY_PICTURE;

CREATE INDEX SP_OWNER_NO ON TBL_STORY_PICTURE (SP_OWNER_NO ASC);

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(1, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(1, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(1, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(1, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(1, 'del1');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(1, 'del2');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(1, 'del3');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(1, 'del4');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(2, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(2, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(2, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(2, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(3, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(3, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(4, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(4, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(4, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(4, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(5, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(5, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(5, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(5, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(6, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(6, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(6, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(7, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(7, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(7, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(8, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(8, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(8, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(8, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(8, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(9, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(9, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(9, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(9, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(10, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(10, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(10, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(11, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(11, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(11, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(11, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(11, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(12, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(12, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(12, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(12, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(13, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(13, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(14, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(14, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(14, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(14, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(14, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(15, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(15, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(15, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(16, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(16, '123');

INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(17, '123');
INSERT INTO TBL_STORY_PICTURE(SP_OWNER_NO, SP_PICTURE_NAME) VALUES(17, '123');

ALTER TABLE TBL_STORY_PICTURE ADD SP_SAVE_DIR VARCHAR(200);
ALTER TABLE TBL_STORY_PICTURE CHANGE SP_DELETD_DATE SP_DELETED_DATE DATETIME;

SHOW INDEX FROM TBL_STORY_PICTURE;
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

CREATE INDEX SL_OWNER_STORY_NO ON TBL_STORY_LIKE (SL_OWNER_STORY_NO ASC);

INSERT INTO TBL_STORY_LIKE(SL_OWNER_STORY_NO, SL_M_ID) VALUES(16, 'gildong');
INSERT INTO TBL_STORY_LIKE(SL_OWNER_STORY_NO, SL_M_ID) VALUES(16, 'chanho');
INSERT INTO TBL_STORY_LIKE(SL_OWNER_STORY_NO, SL_M_ID) VALUES(16, 'seari');
INSERT INTO TBL_STORY_LIKE(SL_OWNER_STORY_NO, SL_M_ID) VALUES(16, 'hihi');

INSERT INTO TBL_STORY_LIKE(SL_OWNER_STORY_NO, SL_M_ID) VALUES(11, 'gildong');
INSERT INTO TBL_STORY_LIKE(SL_OWNER_STORY_NO, SL_M_ID) VALUES(11, 'chanho');
INSERT INTO TBL_STORY_LIKE(SL_OWNER_STORY_NO, SL_M_ID) VALUES(11, 'seari');
INSERT INTO TBL_STORY_LIKE(SL_OWNER_STORY_NO, SL_M_ID) VALUES(11, 'hihi');
INSERT INTO TBL_STORY_LIKE(SL_OWNER_STORY_NO, SL_M_ID) VALUES(11, 'seari1');
INSERT INTO TBL_STORY_LIKE(SL_OWNER_STORY_NO, SL_M_ID) VALUES(11, 'hihi1');

SHOW INDEX FROM TBL_STORY_LIKE;
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

SELECT MAX(R_NO) + 1 FROM TBL_REPLY;
(SELECT MAX(R_NO) + 1 FROM TBL_REPLY);

UPDATE TBL_REPLY SET R_ORGIN_NO = 34 WHERE R_NO = 34;

ALTER TABLE TBL_REPLY ADD R_IS_DELETED TINYINT DEFAULT 0;
ALTER TABLE TBL_REPLY ADD SP_DELETD_DATE DATETIME;
ALTER TABLE TBL_REPLY ADD SP_DELETD_DATE DATETIME;
ALTER TABLE TBL_REPLY CHANGE SP_DELETD_DATE R_DELETD_DATE DATETIME;
ALTER TABLE TBL_REPLY CHANGE R_DELETD_DATE R_DELETED_DATE DATETIME;
ALTER TABLE TBL_REPLY MODIFY R_IS_DELETED TINYINT AFTER R_M_ID;
ALTER TABLE TBL_REPLY MODIFY R_DELETD_DATE DATETIME AFTER R_IS_DELETED;
ALTER TABLE TBL_REPLY MODIFY R_TXT VARCHAR(200);
ALTER TABLE TBL_REPLY CHANGE COLUMN R_ORGIN_NO R_ORIGIN_NO INT NOT NULL;

CREATE INDEX R_ORGIN_NO ON TBL_REPLY(R_ORGIN_NO ASC);

INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 16, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 16, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 16, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 16, 'gildong', 'gildong');

INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 6, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 6, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 6, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 6, 'gildong', 'gildong');

INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 7, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 7, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 7, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 7, 'gildong', 'gildong');

INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 8, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 8, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 8, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 8, 'gildong', 'gildong');

INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 1, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 1, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 1, 'gildong', 'gildong');
INSERT INTO TBL_REPLY(R_ORGIN_NO, R_OWNER_STORY_NO, R_TXT, R_M_ID) VALUES(1, 1, 'gildong', 'gildong');

SHOW INDEX FROM TBL_REPLY;

SELECT R_NO FROM TBL_REPLY ORDER BY R_NO DESC LIMIT 1;

SELECT * FROM TBL_REPLY WHERE R_OWNER_STORY_NO = 16 ORDER BY R_REG_DATE DESC;

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

CREATE INDEX RL_OWNER_STORY_NO ON TBL_REPLY_LIKE (RL_OWNER_STORY_NO ASC);

SHOW INDEX FROM TBL_REPLY_LIKE;

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

INSERT INTO TBL_FRIEND_REQUEST(FR_REQ_ID, FR_RES_ID, FR_ILCHON_NAME) VALUES('gildong', 'seari', '일촌명이걸로해주세용');

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

CREATE INDEX F_OWNER_ID ON TBL_FRIEND (F_OWNER_ID ASC);

INSERT INTO TBL_FRIEND(F_OWNER_ID, F_ID, F_ILCHON_NAME) VALUES('gildong', 'chanho', '찬호');
INSERT INTO TBL_FRIEND(F_OWNER_ID, F_ID, F_ILCHON_NAME) VALUES('gildong', 'seari', '세리');
INSERT INTO TBL_FRIEND(F_OWNER_ID, F_ID, F_ILCHON_NAME) VALUES('gildong', 'hihi', '하이하이');


SHOW INDEX FROM TBL_FRIEND;

-- --------------------------------------------------------


-- 토큰 테이블 미구현 -------------------------------------
CREATE TABLE TBL_TOKEN(
    M_ID VARCHAR(20) NOT NULL UNIQUE,
    TOKEN VARCHAR(1000) NOT NULL,
    REG_DATE DATETIME DEFAULT NOW()
);

SELECT * FROM TBL_TOKEN;
DELETE FROM TBL_TOKEN;
DROP TABLE TBL_TOKEN;

-- 매일 한번 실행하여 30일이 지난 토큰을 지운다.
CREATE EVENT IF NOT EXISTS delete_expired_tokens_event
ON SCHEDULE 
	EVERY 1 DAY -- 매일 실행
DO
	DELETE FROM TBL_TOKEN 
    WHERE REG_DATE < DATE_SUB(NOW(), INTERVAL 30 DAY);


SHOW EVENTS;
DROP EVENT delete_expired_tokens_event;


-- --------------------------------------------------------


-- --------------------------------------------------------



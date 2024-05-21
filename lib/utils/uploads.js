const multer = require("multer");
const uuid4 = require("uuid4");
const path = require('path');
const fs = require('fs')
const DEV_PROD_VARIABLE = require("../config/config");
const { printLog } = require("./logger");
const { verifyToken } = require("./jwt");

const uploads = {

    profileUpload: multer(
        {
            storage: multer.diskStorage({
            destination(req, file, done) {

                let fileDir = DEV_PROD_VARIABLE.MEMBER_PROFILE_THUM_DIR + `${req.body.m_id}/`;

                if(!fs.existsSync(fileDir)){
                    fs.mkdirSync(fileDir, { recursive: true });
                }

                done(null, fileDir);

            },
            filename(req, file, done) {

                const name = uuid4();
                const ext = path.extname(file.originalname);
                const filename = name + ext;

                console.log('name----', name);
                console.log('ext----', ext);
                console.log('filename----', filename);

                done(null, filename);
            },
            }),
            limits: { fileSize: 1024 * 1024 * 5 },
        }
    ),

    pictureUpload: multer(
        {
            storage: multer.diskStorage({
            destination(req, file, done) {

                let now = new Date();
                let year = now.getFullYear();
                let month = String(now.getMonth() + 1).padStart(2, '0');
                let day = String(now.getDate()).padStart(2, '0');
                let hour = String(now.getHours()).padStart(2, '0');
                let minute = String(now.getMinutes()).padStart(2, '0');
                let second = String(now.getSeconds()).padStart(2, '0');

                let nowDate = `${year}${month}${day}${hour}${minute}${second}`;

                let m_id = verifyToken(req.headers['authorization']).m_id;

                let fileDir = DEV_PROD_VARIABLE.STORY_PICTURES_DIR + `${m_id}/${nowDate}/`;

                if(!fs.existsSync(fileDir)){
                    fs.mkdirSync(fileDir, { recursive: true })
                }

                done(null, fileDir);

            },
            filename(req, file, done) {

                printLog('pictureUpload()', file);

                const name = uuid4();
                const ext = path.extname(file.originalname);
                const filename = name + ext;
                done(null, filename);
            },
            }),
            limits: { fileSize: 1024 * 1024 * 5 },
        }
    ),

    pictureUpload_modify: multer(
        {
            storage: multer.diskStorage({
            destination(req, file, done) {

                let m_id = verifyToken(req.headers['authorization']).m_id;

                console.log('upload post: ', req.body);

                let sp_save_dir = req.body.sp_save_dir;

                let fileDir = DEV_PROD_VARIABLE.STORY_PICTURES_DIR + `${m_id}/${sp_save_dir}/`;

                if(!fs.existsSync(fileDir)){
                    fs.mkdirSync(fileDir, { recursive: true })
                }

                done(null, fileDir);

            },
            filename(req, file, done) {

                printLog('pictureUpload()', file);

                const name = uuid4();
                const ext = path.extname(file.originalname);
                const filename = name + ext;
                done(null, filename);
            },
            }),
            limits: { fileSize: 1024 * 1024 * 5 },
        }
    ),

}  

module.exports = uploads;
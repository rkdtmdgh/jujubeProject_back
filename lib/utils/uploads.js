const multer = require("multer");
const uuid4 = require("uuid4");
const path = require('path');
const fs = require('fs')
const DEV_PROD_VARIABLE = require("../config/config");

const uploads = {

    profileUpload: multer(
        {
            storage: multer.diskStorage({
            destination(req, file, done) {

                let fileDir = DEV_PROD_VARIABLE.MEMBER_PROFILE_THUM_DIR + `${req.body.m_id}\\`;

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
            limits: { fileSize: 1024 * 1024 },
        }
    ),

    pictureUpload: multer(
        {
            storage: multer.diskStorage({
            destination(req, file, done) {

                let fileDir = DEV_PROD_VARIABLE.STORY_PICTURES_DIR + `${req.user}\\`;

                if(!fs.existsSync(fileDir)){
                    fs.mkdirSync(fileDir)
                }

                done(null, fileDir);

            },
            filename(req, file, done) {
                const name = uuid4();
                const ext = path.extname(file.originalname);
                const filename = name + ext;
                done(null, filename);
            },
            }),
            limits: { fileSize: 1024 * 1024 },
        }
    ),

}  

module.exports = uploads;
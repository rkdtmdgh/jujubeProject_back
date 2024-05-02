const os = require('os');

// server. linux. 
let DEV_PROD_VARIABLE = {

    STORY_PICTURES_DIR : '/home/ubuntu/jujube/story/upload/storyPictures/',
    MEMBER_PROFILE_THUM_DIR : '/home/ubuntu/jujube/member/upload/profile_thums/',
    REDIRECT_URIS : 'http://서버IP:3001/auth/google/callback',
    PORT : 3001,
    ACCESS_SECRET : 'jujubeaccesssecret',
    REFRESH_SECRET : 'jujuberefreshsecret'

}

// local. windows
if (os.version().includes('Windows')) { 
    DEV_PROD_VARIABLE.STORY_PICTURES_DIR = 'C:\\jujube\\upload\\storyPictures\\';
    DEV_PROD_VARIABLE.MEMBER_PROFILE_THUM_DIR = 'C:\\jujube\\upload\\profile_thums\\';
    DEV_PROD_VARIABLE.REDIRECT_URIS = 'http://localhost:3001/auth/google/callback';
    PORT = 3001;

}

module.exports = DEV_PROD_VARIABLE;
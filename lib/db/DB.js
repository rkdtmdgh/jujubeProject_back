const DBs = require('./DBs');

const DB = DBs.DB_DEV();

DB.connect();

module.exports = DB;

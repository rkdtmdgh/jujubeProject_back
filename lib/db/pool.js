const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'db-jujube.clk6emgge6js.ap-northeast-2.rds.amazonaws.com',
    user: 'root',
    password: 'jujube1234',
    database: 'DB_JUJUBE',
    dateStrings: true,
    connectionLimit: 50,
});

module.exports = pool;
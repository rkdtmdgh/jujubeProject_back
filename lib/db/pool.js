const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'jujube-db-server.c5i8y42eyen4.ap-southeast-2.rds.amazonaws.com',
    user: 'root',
    password: 'jujube1234',
    database: 'DB_JUJUBE',
    dateStrings: true,
    connectionLimit: 10,
});

module.exports = pool;
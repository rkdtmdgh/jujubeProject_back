const mysql = require('mysql2');
const mysql2 = require('mysql2/promise');

const DBs = {

    DB_DEV: () => {

        return mysql.createConnection({
            host: 'db-jujube.clk6emgge6js.ap-northeast-2.rds.amazonaws.com',
            port: '3306',
            user: 'root',
            password: 'jujube1234',
            database: 'DB_JUJUBE',
            dateStrings: true,
        });

    },

    DB_PROD: () => {

        return mysql.createConnection({
            host: 'db-jujube.clk6emgge6js.ap-northeast-2.rds.amazonaws.com',
            port: '3306',
            user: 'root',
            password: 'jujube1234',
            database: 'DB_JUJUBE',
            dateStrings: true,
        });

    },

    DB_POOL: mysql.createPool({
        host: 'db-jujube.clk6emgge6js.ap-northeast-2.rds.amazonaws.com',
        user: 'root',
        password: 'jujube1234',
        database: 'DB_JUJUBE',
        dateStrings: true,
        connectionLimit: 10,
    })

}

module.exports = DBs;
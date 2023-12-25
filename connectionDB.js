const mysql = require('mysql');

function newConnection()
{
    let conn = mysql.createConnection({
        host:'34.71.83.103',
        user: 'root',
        password:'admin123',
        database:'doodlebob'
    });
    return conn;
}
module.exports = newConnection;

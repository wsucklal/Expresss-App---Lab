const mysql = require('mysql');

let conn = mysql.createConnection({
    host:'34.71.83.103',
    user: 'root',
    password:'admin123',
    database:'doodlebob'
});

conn.connect();

conn.query(`DROP TABLE Availability`,
                (err,rows,fields) => {
                    if (err){
                        console.log(err);
                    }
                    else{
                        console.log('Dropped Table');
                    }       
                }
            );

conn.query(`CREATE TABLE Availability ( Name varchar(100) NOT NULL PRIMARY KEY, LastUpdate timestamp, AvailTimes json )`, 
            (err,rows,fields) => {
                if (err){
                    console.log(err);
                }
                    
                else{
                    console.log('Created Table');
                 }
                    
            });
            
conn.query( `INSERT INTO Availability VALUES ("Admin",CURRENT_TIME(),'["1:00","2:00","3:00","4:00","5:00","6:00", "7:00", "8:00", "9:00", "10:00"]')`,
            (err,rows,fields) => {
                if (err)
                    console.log(err);
                else
                    console.log('Inserted row');
            });      
conn.query( `UPDATE Availability SET LastUpdate = CURRENT_TIME(), AvailTimes = '{"1:00":true, "2:00":true, "3:00":true, "4:00":false, "5:00":true, "6:00":true, "7:00":true, "8:00":true, "9:00":true, "10:00":true}' where Name = "Warren"`,
            (err,rows,fields) => {
                if (err){
                    console.log(err);
                }
                    
                else{
                    console.log('Inserted row');
                }      
            });

conn.query( `SELECT * FROM Availability `, 
            (err,rows,fields) => {
                let avail = [];

                if (err){
                    console.log(err);
                }   
                else {
                    console.log('Selected row');
                }   

                console.log(rows);
            });

conn.end();
const express = require("express");
const newConnection = require("./connectionDB");

const correctEmail = "admin@uwo.ca";
const correctPassword = "123";
const app = express();

// Serve static contents
app.use(express.static("static"));

app.use(
  express.urlencoded({
    extended: true,
  })
);

// Guest registration
app.post("/guest/register", (req, res) => {

    // If guest name isn't in DB curently as it is the pk
    if (!req.body.otherNames.includes(req.body.guestName)) {
      let conn = newConnection();
      conn.connect();
  
      // New availability entered by the guest
      let newAvail = {}; 
  
      // Adds true false value for each availability entry. Converts checkbox values to true false
      for (var i = 0; i < 10; i++) {
        newAvail[req.body[`${"t" + i}`]] = req.body[`${"box" + i}`] === "on";
      }
  
      // Adds  guest to DB
      conn.query(
        `INSERT INTO Availability VALUES("` + req.body.guestName + `",CURRENT_TIME(),'` + JSON.stringify(newAvail) + `')`,
        (err, rows, fields) => {
          if (err) {
            console.log(err);
            res.send("Retry, Availability was not added.");
          } 
          else {
          // Reload and sends user to guest page
            res.redirect("/guest"); 
          }
        }
      );
      conn.end();
    } 
    else {
      res.send(
        "Enter another name. Duplicate names cannot be added to availability page.  "
      );
    }
  });
  
  // Guest page
  app.get("/guest", (req, res) => {
  
    let conn = newConnection();
    conn.connect();
  
    let content = "<div><div>Doodlebob</div>";
  
    // Selects all the peope in the databese, selects the admin first and sorts alphabetically
    conn.query(
      `SELECT Name, AvailTimes from Availability order by Name, case Name when "Admin" then '1' else '2' end`,
      (err, rows, fields) => {
        if (err) {
          console.log(err);
          res.send("Unknown Error Occured");
        } 
        else {
          //Gets the admin times and removes the admin from the rows
          let adminTimes = JSON.parse(rows[0].AvailTimes);
          rows.shift();
  
          content +=
            '<table style="min-width: 100vw; padding: 5px 15px">' +
            '<form method="post" action="/guest/register" style="display:table-row-group; vertical-align: middle; border-color: inherit">' +
            "<thead>" +
            "<tr>" +
            "<th>Name</th>";
  
          // Add table head data for each time
          for (var i = 0; i < 10; i++) {
            content +=
              '<th><input type="time" name="t' + i + '" value="' + adminTimes[i] + '" readonly></th>';
          }
  
          content += "</tr></thead><tbody>";
  
          for (r of rows) {
  
          // Parses the availablity to a json object
            let times = JSON.parse(r.AvailTimes); 
            content +=
              '<tr><td style="text-align: center; width:175px"><input type="text" id="' + r.Name + '-row" name="otherNames" value="' + r.Name + '" readonly></td>';
  
            // Adds a checkbox for each column that has previous usr entry (chekced indicates available)
            for (var i = 0; i < adminTimes.length; i++) {
              content +=
                '<td style="text-align: center"><input type="checkbox" id="' + r.Name + "-box-" + i + '" checked="' + (times[`${adminTimes[i]}`] ? "checked" : "") +'" onclick="return false;"></td>';
            }
            content += "</tr>";
          }
  
          content +=
            "<tr>" +
            '<td style="text-align: center; width:175px">' +
            '<input type="text" id="guest-name" name="guestName" placeholder="Name" required>' +
            "</td>";
  
          // Adds a row of check boxes incase the guest would like to enter their availability
          for (var i = 0; i < 10; i++) {
            content +=
              '<td style="text-align: center"><input type="checkbox" name="box' + i +'"></td>';
          }
  
          // Adds save guest button for the form and closes other html elements
          content +=
            '</tr><tr><td style="text-align:center" colspan=11><button type="submit">Add Availability</button></td></tr></tbody></form></table></div>';
  
          res.send(content);
        }
      }
    );
    conn.end();
  });

// Admin login
app.post("/admin", (req, res) => {
  //Checks passwords and username
  if ( req.body.adminUsr === correctEmail && req.body.adminPass === correctPassword ) {

    let conn = newConnection();
    conn.connect();

    let content =
      "<div><div>Doodlebob Admin Page ( save time changes and availabilities individually)</div>" +
      '<table style="min-width: 100vw; padding: 5px 15px">';

    //Gets name & availtimes obj from availability table with Admin entry first
    conn.query(
      `SELECT Name, AvailTimes FROM Availability ORDER BY Name, CASE Name WHEN "Admin" THEN '1' else '2' end`,
      (err, rows, fields) => {
        if (err) console.log(err);
        else {
          // Get current ordered times array
          let adminTimes = JSON.parse(rows[0].AvailTimes);
          //Remove Admin from array
          rows.shift(); 

          content +=
            '<table style="min-width: 100vw; padding: 5px 15px">' +
            '<form action="/admin/time" method="post" style="display:table-header-group; vertical-align: middle; border-color: inherit">' +
            "<tr>" +
            "<th>Name</th>";

          // Adds enabled time input for each column,  first value coresponds user rows
          for (var i = 0; i < 10; i++) {
            content +=
              '<th><input type="time" id="t' +
              i +
              '" name="t' +
              i +
              '" value="' +
              adminTimes[i] +
              '" required></th>';
          }

          // Adds save changes button for save time changes form
          content +=
            "</tr>" +
            "<tr>" +
            "<th></th>" +
            '<th colspan="10"><button type="submit" id="save-times-btn">Save Changes</button></th>' +
            "</tr>" +
            "</form>" +
            '<form action="/admin/avail" method="post">';

          // Add row for each user
          for (r of rows) {
            // JSON string to json object for availability times
            let times = JSON.parse(r.AvailTimes);

            content +=
              '<tr><td style="text-align: center; width:175px"><input type="text" id="' + r.Name + '-row" value="' + r.Name + '" readonly></td>';

            // Add checkbox to each column
            for (var i = 0; i < adminTimes.length; i++) {
              // Checks what availability is set to
              if (times[`${adminTimes[i]}`]) {
                content +=
                  '<td style="text-align: center"><input type="checkbox" id="' + r.Name + "Box" + i + '" name="' + r.Name + "Box" + i + '" checked="checked"></td>';
              } 
              else {
                content +=
                  '<td style="text-align: center"><input type="checkbox" id="' + r.Name + "Box" + i +'" name="' + r.Name + "Box" + i + '"></td>'; 
              }
            }
            content += "</tr>";
          }

          // Adds save button for the save available form
          content +=
            "<tr>" +
            "<th></th>" +
            '<th colspan="10"><button type="submit" id="save-avail-btn">Save Changes</button></th>' +
            "</tr></form></table></div>";

          // Sends responce
          res.send(content);
        }
      }
    );
    conn.end();
  } 
  else {
    //login failed, make user relogin
    res.redirect("/");
  }
});

// Change availability post
app.post("/admin/avail", (req, res) => {
// admin times saved in the DB
  let times = []; 
  // name and availability for each user in array
  let usrs = []; 
  // index of availability that updates in usrs array
  let updates = []; 
  //Update query
  let updateStr = `UPDATE Availability SET LastUpdate = CURRENT_TIME(), AvailTimes = (case Name `; 

  let conn = newConnection();
  conn.connect();

  // Selects name and availtimes obj from availability, Admin entry first
  conn.query(
    `SELECT Name, AvailTimes FROM Availability ORDER BY Name, CASE Name WHEN "Admin" THEN '1' ELSE '2' end`,
    (err, rows, fields) => {
      if (err) {
        console.log(err);
        conn.end();
        res.send("Not Updated. Unkown Error.");
      } 
      else {
        // Gets array of admin times, removes admin from rows
        times = JSON.parse(rows[0].AvailTimes);
        rows.shift();

        // Populates users array with users name and availability times obj
        for (r of rows) {
          usrs.push([r.Name, JSON.parse(r.AvailTimes)]);
        }

        // Checks if the usrs available times stored in the db match currently display
        for (var i = 0; i < usrs.length; i++) {
          for (var j = 0; j < 10; j++) {
            // If  index isnt in updated array and stored available times dont match displayed
            if (!updates.includes(i) && !((req.body[`${usrs[i][0] + "Box" + j}`] == "on") == usrs[i][1][`${times[j]}`])) {
              updates.push(i);
            }
            // Updates usr object incase its needed for update statement
            usrs[i][1][`${times[j]}`] = req.body[`${usrs[i][0] + "Box" + j}`] == "on";
          }
        }

        // Adds each update requirement to the query string
        for (u of updates) {
          updateStr +=
            `WHEN '` + usrs[u][0] + `' THEN '` + JSON.stringify(usrs[u][1]) + `' `;
        }

        updateStr += `ELSE (AvailTimes) END)`;

        // If there is an update, update DB
        if (updates.length > 0) {
          conn.query(updateStr, (err, rows, fields) => {
            if (err) {
              console.log(err);
              res.send("Update not complete ");
            } 
            else {
              res.send("Successful Update");
            }
          });
        } else {
          //No changes so no update
          res.send("No Updates since no changes were made");
        }
        conn.end();
      }
    }
  );
});

// Change time selection
app.post("/admin/time", (req, res) => {
// Stores new times the admin changed
  let newTimes = []; 
  //Duplicate value trying to be set error. 
  let dupValErr = false; 

  //Checks for duplicate time trying to be entered
  for (var i = 0; i < 10; i++) {
    if (newTimes.includes(req.body[`${"t" + i}`])) {
      dupValErr = true;
      //Breaks loop if error is found
      i = 10; 
    }

    // Adds all times to the array
    newTimes.push(req.body[`${"t" + i}`]);
  }
    //Sorts times from lowest to highest
  newTimes.sort(); 

  // If no duplicate value error update
  if (!dupValErr) {
    let conn = newConnection();
    conn.connect();

    // Updates Admins times
    conn.query(
      `update Availability set LastUpdate = CURRENT_TIME(), AvailTimes = '` +
        JSON.stringify(newTimes) +
        `' where Name = "Admin"`,
      (err, rows, fields) => {
        if (err) {
          console.log(err);
          res.send(
            "Go back and retry. Changes not successful. "
          );
        } 
        else {
          res.send(
            "Click back and refresh page. Changes successful. "
          ); 
        }
      }
    );
    conn.end();
  } 
  else {
    res.send(
      " Refresh page and retry. Duplicate values cannot be entered."
    );
  }
});



//Hosted on port 2000
app.listen(2000);

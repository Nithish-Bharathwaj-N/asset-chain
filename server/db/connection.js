const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "nithish",
  password: "pass1234", 
  database: "asset_management"
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

module.exports = db;

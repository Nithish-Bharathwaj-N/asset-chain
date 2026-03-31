const express = require("express");
const router = express.Router();
const db = require("../db/connection");


// ======================
// LOGIN
// ======================

router.post("/login", (req, res) => {

  const email = req.body.email.trim();
  const password = req.body.password.trim();

  const query = "SELECT * FROM users WHERE email=? AND password=?";

  db.query(query, [email, password], (err, results) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = results[0];

    res.json({
      message: "Login successful",
      role: user.role,
      user_id: user.id
    });

  });

});


// ======================
// STUDENT REGISTRATION
// ======================

router.post("/register", (req, res) => {

  const name = req.body.name.trim();
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  if (!email.endsWith("@citchennai.net")) {
    return res.status(400).json({
      message: "Please use your @citchennai.net email"
    });
  }

  const checkUser = "SELECT * FROM users WHERE email=?";

  db.query(checkUser, [email], (err, results) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (results.length > 0) {
      return res.json({
        message: "Account already exists"
      });
    }

    const sql = "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)";

    db.query(sql, [name, email, password, "student"], (err, result) => {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        message: "Student account created successfully"
      });

    });

  });

});


// ======================
// HEAD CREATES INCHARGE
// ======================

router.post("/create-incharge", (req, res) => {

  const name = req.body.name.trim();
  const email = req.body.email.trim();
  const password = req.body.password.trim();
  const lab = req.body.lab.trim();

  if (!email.endsWith("@citchennai.net")) {
    return res.status(400).json({
      message: "Use official @citchennai.net email"
    });
  }

  const checkUser = "SELECT * FROM users WHERE email=?";

  db.query(checkUser, [email], (err, results) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (results.length > 0) {
      return res.json({
        message: "User already exists"
      });
    }

    const insertUser =
      "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)";

    db.query(insertUser, [name, email, password, "incharge"], (err, result) => {

      if (err) {
        return res.status(500).json(err);
      }

      const userId = result.insertId;

      const getLab = "SELECT id FROM labs WHERE lab_name=?";

      db.query(getLab, [lab], (err, labResult) => {

        if (err) {
          return res.status(500).json(err);
        }

        if (labResult.length === 0) {
          return res.json({
            message: "Lab not found. Create lab first."
          });
        }

        const labId = labResult[0].id;

        const assignLab =
          "INSERT INTO lab_incharges (lab_id,user_id) VALUES (?,?)";

        db.query(assignLab, [labId, userId], (err, result) => {

          if (err) {
            return res.status(500).json(err);
          }

          res.json({
            message: "Incharge created and assigned to lab"
          });

        });

      });

    });

  });

});


// ======================
// GET ALL INCHARGES
// ======================

router.get("/incharges", (req, res) => {

  const query = `
  SELECT users.id, users.name, users.email, labs.lab_name
  FROM users
  JOIN lab_incharges ON users.id = lab_incharges.user_id
  JOIN labs ON labs.id = lab_incharges.lab_id
  WHERE users.role='incharge'
  `;

  db.query(query, (err, result) => {

    if (err) {
      return res.status(500).json(err);
    }

    res.json(result);

  });

});


module.exports = router;
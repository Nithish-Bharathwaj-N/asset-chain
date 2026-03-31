const express = require("express");
const router = express.Router();
const db = require("../db/connection");

/* -------------------------
   REGISTER STUDENT
------------------------- */

router.post("/register",(req,res)=>{

const {name,contact,email,department,password} = req.body;

/* validate CIT email */

if(!email.endsWith("@citchennai.net")){
return res.json({
success:false,
message:"Only CIT email allowed"
});
}

const sql = `
INSERT INTO students
(name,contact_number,email,department,password)
VALUES (?,?,?,?,?)
`;

db.query(sql,[name,contact,email,department,password],(err)=>{

if(err){

return res.json({
success:false,
message:"Email already registered"
});

}

res.json({
success:true,
message:"Account created successfully"
});

});

});


/* -------------------------
   STUDENT LOGIN
------------------------- */

router.post("/login",(req,res)=>{

const {email,password} = req.body;

const sql = "SELECT * FROM students WHERE email=?";

db.query(sql,[email],(err,result)=>{

if(err) return res.status(500).json({success:false});

if(result.length===0){

return res.json({
success:false,
message:"Student not found"
});

}

const student = result[0];

if(student.password !== password){

return res.json({
success:false,
message:"Incorrect password"
});

}

res.json({
success:true,
student:student
});

});

});

module.exports = router;
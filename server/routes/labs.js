const express = require("express");
const router = express.Router();
const db = require("../db/connection");


/* ======================
   CREATE LAB
====================== */

router.post("/create",(req,res)=>{

const lab_name = req.body.lab_name.trim();

const checkQuery = "SELECT * FROM labs WHERE lab_name=?";

db.query(checkQuery,[lab_name],(err,result)=>{

if(err){
return res.status(500).json(err);
}

if(result.length > 0){
return res.json({ message:"Lab already exists" });
}

const insertQuery =
"INSERT INTO labs (lab_name,created_by) VALUES (?,?)";

db.query(insertQuery,[lab_name,1],(err,data)=>{

if(err){
return res.status(500).json(err);
}

res.json({ message:"Lab created successfully" });

});

});

});


/* ======================
   LAB DETAILS
====================== */

router.get("/details/:lab_id",(req,res)=>{

const lab_id = req.params.lab_id;

const sql = `
SELECT

l.lab_name,

u.name AS incharge_name,
u.email AS incharge_email,

e.id AS equipment_id,
e.equipment_name,
e.total_quantity,
e.available_quantity,

(e.total_quantity - e.available_quantity) AS issued_quantity,

COALESCE(d.light_damage,0) AS light_damage,
COALESCE(d.medium_damage,0) AS medium_damage,
COALESCE(d.heavy_damage,0) AS heavy_damage

FROM labs l

LEFT JOIN lab_incharges li
ON l.id = li.lab_id

LEFT JOIN users u
ON li.user_id = u.id

LEFT JOIN equipment e
ON e.lab_id = l.id

LEFT JOIN equipment_damage d
ON e.id = d.equipment_id

WHERE l.id = ?
`;

db.query(sql,[lab_id],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result);

});

});


/* ======================
   GET ALL LABS
====================== */

router.get("/",(req,res)=>{

db.query("SELECT * FROM labs",(err,results)=>{

if(err){
return res.status(500).json(err);
}

res.json(results);

});

});


module.exports = router;
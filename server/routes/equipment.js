const express = require("express");
const router = express.Router();
const db = require("../db/connection");


/* =====================================
   ADD EQUIPMENT
===================================== */

router.post("/add",(req,res)=>{

const {lab_id,equipment_name,quantity,max_per_student} = req.body;

const check = `
SELECT * FROM equipment
WHERE lab_id=? AND LOWER(equipment_name)=LOWER(?)
`;

db.query(check,[lab_id,equipment_name],(err,result)=>{

if(err){
return res.status(500).json(err);
}

if(result.length > 0){

/* EQUIPMENT EXISTS → UPDATE QUANTITY */

const update = `
UPDATE equipment
SET total_quantity = total_quantity + ?,
available_quantity = available_quantity + ?
WHERE lab_id=? AND LOWER(equipment_name)=LOWER(?)
`;

db.query(update,
[quantity,quantity,lab_id,equipment_name],
(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json({
message:"Equipment quantity updated"
});

});

}
else{

/* NEW EQUIPMENT */

const insert = `
INSERT INTO equipment
(lab_id,equipment_name,total_quantity,available_quantity,max_per_student)
VALUES (?,?,?,?,?)
`;

db.query(insert,
[lab_id,equipment_name,quantity,quantity,max_per_student],
(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json({
message:"New equipment added"
});

});

}

});

});


/* =====================================
   EQUIPMENT STATUS (WITH DAMAGE INFO)
===================================== */

router.get("/status/:lab_id",(req,res)=>{

const lab_id = req.params.lab_id;

const sql = `
SELECT

e.id,
e.equipment_name,
e.total_quantity,
e.available_quantity,

(e.total_quantity - e.available_quantity) AS issued_quantity,

COALESCE(d.light_damage,0) AS light_damage,
COALESCE(d.medium_damage,0) AS medium_damage,
COALESCE(d.heavy_damage,0) AS heavy_damage

FROM equipment e

LEFT JOIN equipment_damage d
ON e.id = d.equipment_id

WHERE e.lab_id = ?
`;

db.query(sql,[lab_id],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result);

});

});


/* =====================================
   NORMAL EQUIPMENT LIST
===================================== */

router.get("/:lab_id",(req,res)=>{

const lab_id = req.params.lab_id;

const sql = `
SELECT * FROM equipment
WHERE lab_id = ?
`;

db.query(sql,[lab_id],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result);

});

});

/* CHECK EQUIPMENT ACROSS ALL LABS */

router.get("/check/:name",(req,res)=>{

const name = req.params.name;

const sql = `
SELECT
l.lab_name,
SUM(e.total_quantity) as quantity
FROM equipment e
JOIN labs l
ON e.lab_id = l.id
WHERE LOWER(e.equipment_name) = LOWER(?)
GROUP BY l.lab_name
`;

db.query(sql,[name],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result);

});

});


module.exports = router;
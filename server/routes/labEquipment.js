const express = require("express");
const router = express.Router();
const db = require("../db/connection");

router.get("/:labId", (req,res)=>{

const labId = req.params.labId;

/* Lab + Incharge */

const labQuery = `
SELECT 
l.lab_name,
u.name AS incharge_name,
u.email AS incharge_email

FROM labs l

LEFT JOIN lab_incharges li
ON l.id = li.lab_id

LEFT JOIN users u
ON li.user_id = u.id

WHERE l.id = ?
`;

db.query(labQuery,[labId],(err,labResult)=>{

if(err){
console.log(err);
return res.status(500).json(err);
}

/* Equipment */

const equipQuery = `
SELECT 
id,
equipment_name,
available_quantity,
max_per_student
FROM equipment
WHERE lab_id = ?
`;

db.query(equipQuery,[labId],(err,equipments)=>{

if(err){
console.log(err);
return res.status(500).json(err);
}

res.json({
lab: labResult[0] || {},
equipment: equipments || []
});

});

});

});

module.exports = router;
const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const QRCode = require("qrcode");

/* ===================================
   GET LAB FOR LOGGED IN INCHARGE
=================================== */

router.get("/lab/:userId",(req,res)=>{

const userId = req.params.userId;

const sql = `
SELECT labs.id AS lab_id, labs.lab_name
FROM labs
JOIN lab_incharges
ON labs.id = lab_incharges.lab_id
WHERE lab_incharges.user_id = ?
`;

db.query(sql,[userId],(err,result)=>{

if(err){
return res.status(500).json(err);
}

if(result.length === 0){
return res.json({ lab_name:"Unknown Lab" });
}

res.json(result[0]);

});

});


/* ===================================
   GET REQUESTS FOR THIS INCHARGE
=================================== */

router.get("/requests/:inchargeId",(req,res)=>{

const inchargeId = req.params.inchargeId;

const sql = `
SELECT 
borrow_requests.id,
borrow_requests.status,
borrow_requests.created_at,
students.name AS student_name,
labs.lab_name

FROM borrow_requests

JOIN students
ON borrow_requests.student_id = students.id

JOIN labs
ON borrow_requests.lab_id = labs.id

JOIN lab_incharges
ON labs.id = lab_incharges.lab_id

WHERE lab_incharges.user_id = ?

ORDER BY borrow_requests.created_at DESC
`;

db.query(sql,[inchargeId],(err,result)=>{

if(err){
console.log(err);
return res.status(500).json({success:false});
}

res.json({
success:true,
requests: result
});

});

});


/* ===================================
   GET SINGLE REQUEST DETAILS
=================================== */

router.get("/request/:id",(req,res)=>{

const requestId = req.params.id;

/* student details */

const sql = `
SELECT 
borrow_requests.id,
borrow_requests.status,
students.name,
students.email,
students.department,
students.contact_number

FROM borrow_requests

JOIN students
ON borrow_requests.student_id = students.id

WHERE borrow_requests.id = ?
`;

db.query(sql,[requestId],(err,result)=>{

if(err){
console.log(err);
return res.status(500).json({success:false});
}

if(result.length===0){
return res.json({success:false});
}

const student = result[0];

/* equipment items */

const itemSql = `
SELECT 
request_items.equipment_id,
request_items.quantity,
request_items.issued_quantity,
equipment.equipment_name

FROM request_items

JOIN equipment
ON request_items.equipment_id = equipment.id

WHERE request_items.request_id = ?
`;

db.query(itemSql,[requestId],(err2,items)=>{

if(err2){
console.log(err2);
return res.status(500).json({success:false});
}

res.json({
success:true,
student,
items
});

});

});

});


/* ===================================
   CONFIRM ISSUE EQUIPMENT
=================================== */

router.post("/issue",(req,res)=>{

const {request_id, items} = req.body;

items.forEach(item=>{

db.query(
`UPDATE request_items 
SET issued_quantity=? 
WHERE request_id=? AND equipment_id=?`,
[item.issued_quantity, request_id, item.equipment_id]
);

db.query(
`UPDATE equipment 
SET available_quantity = available_quantity - ?
WHERE id=?`,
[item.issued_quantity, item.equipment_id]
);

});

/* update request status */

db.query(
`UPDATE borrow_requests SET status='approved' WHERE id=?`,
[request_id]
);


/* generate RETURN QR */

const returnLink = `http://localhost:3000/return/${request_id}`;

QRCode.toDataURL(returnLink,(err,qr)=>{

if(err){
console.log(err);
return res.status(500).json({success:false});
}

db.query(
`UPDATE borrow_requests SET return_qr=? WHERE id=?`,
[qr, request_id]
);

res.json({
success:true,
return_qr: qr
});

});

});

module.exports = router;
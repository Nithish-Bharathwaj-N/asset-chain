const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const QRCode = require("qrcode");

/* =====================================================
   SUBMIT EQUIPMENT REQUEST
===================================================== */

router.post("/submit-request", (req, res) => {

const { student_id, lab_id, items } = req.body;

/* Create request */

const sql = `
INSERT INTO borrow_requests (student_id, lab_id)
VALUES (?,?)
`;

db.query(sql, [student_id, lab_id], async (err, result) => {

if (err) {
console.log(err);
return res.status(500).json({ success:false });
}

const requestId = result.insertId;

/* Insert requested equipment */

const itemSql = `
INSERT INTO request_items (request_id,equipment_id,quantity)
VALUES ?
`;

const values = items.map(item => [
requestId,
item.equipment_id,
item.quantity
]);

db.query(itemSql, [values], async (err2) => {

if (err2) {
console.log(err2);
return res.status(500).json({ success:false });
}

try {

/* Generate QR for pickup */

const qrData = `http://localhost:3000/incharge/request/${requestId}`;

const qrImage = await QRCode.toDataURL(qrData);

/* Save QR */

db.query(
`UPDATE borrow_requests SET qr_code=? WHERE id=?`,
[qrImage, requestId]
);

/* Send response */

res.json({
success:true,
request_id: requestId,
qr: qrImage
});

} catch (error) {

console.log(error);

res.status(500).json({
success:false,
message:"QR generation failed"
});

}

});

});

});


/* =====================================================
   GET QR AGAIN (Student reopen QR)
===================================================== */

router.get("/request-qr/:id",(req,res)=>{

const requestId = req.params.id;

const sql = `
SELECT qr_code, status
FROM borrow_requests
WHERE id=?
`;

db.query(sql,[requestId],(err,result)=>{

if(err){
console.log(err);
return res.status(500).json({success:false});
}

if(result.length === 0){
return res.json({success:false});
}

res.json({
success:true,
qr: result[0].qr_code,
status: result[0].status
});

});

});


/* =====================================================
   GET ALL STUDENT REQUESTS
===================================================== */

router.get("/my-requests/:studentId",(req,res)=>{

const studentId = req.params.studentId;

const sql = `
SELECT id, status, created_at
FROM borrow_requests
WHERE student_id=?
ORDER BY created_at DESC
`;

db.query(sql,[studentId],(err,result)=>{

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


module.exports = router;
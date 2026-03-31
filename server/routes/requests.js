const express = require("express");
const router = express.Router();
const db = require("../db/connection");

const multer = require("multer");
const notify = require("../utils/notify");

/* ================================= */
/* FILE UPLOAD SETUP */
/* ================================= */

const storage = multer.diskStorage({
destination: function(req,file,cb){
cb(null,"uploads/");
},
filename: function(req,file,cb){
cb(null, Date.now() + "_" + file.originalname);
}
});

const upload = multer({ storage: storage });


/* ================================= */
/* CREATE REQUEST (INCHARGE) */
/* ================================= */

router.post("/create",(req,res)=>{

const {
lab_id,
requested_by,
product_name,
quantity_needed,
existing_quantity,
estimated_price,
reference_link
} = req.body;

const sql = `
INSERT INTO equipment_requests
(lab_id,requested_by,product_name,quantity_needed,existing_quantity,estimated_price,reference_link)
VALUES (?,?,?,?,?,?,?)
`;

db.query(sql,
[lab_id,requested_by,product_name,quantity_needed,existing_quantity,estimated_price,reference_link],
(err,result)=>{

if(err){
return res.status(500).json(err);
}

/* GET CREATED REQUEST ID */

const requestId = result.insertId;

/* 🔔 SEND NOTIFICATION TO HEAD */

notify(
1,
"head",
`New equipment request: ${product_name}`,
`/head_request_details.html?id=${requestId}`
);

res.json({
message:"Request submitted successfully"
});

});

});


/* ================================= */
/* GET REQUESTS FOR INCHARGE */
/* ================================= */

router.get("/incharge/:user_id",(req,res)=>{

const user_id = req.params.user_id;

const sql = `
SELECT *
FROM equipment_requests
WHERE requested_by = ?
ORDER BY created_at DESC
`;

db.query(sql,[user_id],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result);

});

});


/* ================================= */
/* GET ALL REQUESTS FOR HEAD */
/* ================================= */

router.get("/",(req,res)=>{

const sql = `
SELECT
r.id,
r.product_name,
r.quantity_needed,
r.estimated_price,
r.status,
r.order_type,
r.order_status,
l.lab_name,
u.name AS requested_by
FROM equipment_requests r
JOIN labs l ON r.lab_id = l.id
JOIN users u ON r.requested_by = u.id
ORDER BY r.created_at DESC
`;

db.query(sql,(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result);

});

});


/* ================================= */
/* GET SINGLE REQUEST */
/* ================================= */

router.get("/:id",(req,res)=>{

const id = req.params.id;

const sql = `
SELECT
r.*,
l.lab_name,
u.name AS requested_by
FROM equipment_requests r
JOIN labs l ON r.lab_id = l.id
JOIN users u ON r.requested_by = u.id
WHERE r.id = ?
`;

db.query(sql,[id],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result[0]);

});

});


/* ================================= */
/* APPROVE REQUEST */
/* ================================= */

router.post("/approve/:id", upload.single("invoice"), (req,res)=>{

const id = req.params.id;

const {
order_type,
ordered_quantity,
reminder_time
} = req.body;

let invoice_file = null;

if(req.file){
invoice_file = req.file.filename;
}

/* Decide order status */

let order_status = "not_ordered";

if(order_type && order_type.toLowerCase().trim() === "ordered"){
order_status = "ordered";
}

const sql = `
UPDATE equipment_requests
SET
status='approved',
order_type=?,
ordered_quantity=?,
reminder_time=?,
order_status=?,
invoice_file=?
WHERE id=?
`;

db.query(sql,
[
order_type,
ordered_quantity,
reminder_time,
order_status,
invoice_file,
id
],
(err,result)=>{

if(err){
return res.status(500).json(err);
}

/* Fetch request info to notify */

db.query(
"SELECT requested_by, product_name FROM equipment_requests WHERE id=?",
[id],
(err,data)=>{

if(data && data.length > 0){

const inchargeId = data[0].requested_by;
const product = data[0].product_name;

/* Message depends on order type */

let message;

if(order_type === "ordered"){
message = `${product} request approved and ordered.`;
}
else{
message = `${product} request approved. Order will be placed later.`;
}

notify(
inchargeId,
"incharge",
message,
`/request_status.html?id=${id}`
);

}

});

res.json({
message:"Request approved successfully"
});

});

});


/* ================================= */
/* REJECT REQUEST */
/* ================================= */

router.post("/reject/:id",(req,res)=>{

const id = req.params.id;
const { reject_reason } = req.body;

const sql = `
UPDATE equipment_requests
SET
status='rejected',
reject_reason=?
WHERE id=?
`;

db.query(sql,[reject_reason,id],(err,result)=>{

if(err){
return res.status(500).json(err);
}

/* 🔔 Notify Incharge */

db.query(
"SELECT requested_by, product_name FROM equipment_requests WHERE id=?",
[id],
(err,data)=>{

if(data && data.length > 0){

notify(
data[0].requested_by,
"incharge",
`Your request for ${data[0].product_name} was rejected`,
`/request_status.html?id=${id}`
);

}

});

res.json({
message:"Request rejected"
});

});

});


/* ================================= */
/* MARK ORDERED (FOR ORDER LATER) */
/* ================================= */

router.post("/mark-ordered/:id", upload.single("invoice"), (req,res)=>{

const id = req.params.id;

let invoice_file = null;

if(req.file){
invoice_file = req.file.filename;
}

const sql = `
UPDATE equipment_requests
SET
order_status='ordered',
invoice_file=?,
ordered_quantity = IFNULL(ordered_quantity, quantity_needed)
WHERE id=?
`;

db.query(sql,[invoice_file,id],(err,result)=>{

if(err){
return res.status(500).json(err);
}

/* 🔔 Notify Incharge */

db.query(
"SELECT requested_by, product_name FROM equipment_requests WHERE id=?",
[id],
(err,data)=>{

if(data && data.length > 0){

notify(
data[0].requested_by,
"incharge",
`${data[0].product_name} has been ordered. Invoice uploaded.`,
`/request_status.html?id=${id}`
);

}

});

res.json({
message:"Order marked successfully"
});

});

});

//view requests

router.get("/request/:id",(req,res)=>{

const requestId = req.params.id;

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

const itemsSql = `
SELECT 
request_items.equipment_id,
request_items.quantity,
equipment.equipment_name

FROM request_items

JOIN equipment
ON request_items.equipment_id = equipment.id

WHERE request_items.request_id = ?
`;

db.query(itemsSql,[requestId],(err2,items)=>{

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


module.exports = router;
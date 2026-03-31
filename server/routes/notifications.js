const express = require("express");
const router = express.Router();
const db = require("../db/connection");

/* GET USER NOTIFICATIONS */

router.get("/:user_id/:role",(req,res)=>{

const user_id = req.params.user_id;
const role = req.params.role;

const sql = `
SELECT *
FROM notifications
WHERE receiver_id=? AND receiver_role=?
ORDER BY created_at DESC
`;

db.query(sql,[user_id,role],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result);

});

});

router.post("/read/:id",(req,res)=>{

const id = req.params.id;

db.query(
"UPDATE notifications SET is_read=1 WHERE id=?",
[id],
(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json({message:"Notification read"});

});

});

/* ============================= */
/* UNREAD COUNT */
/* ============================= */

router.get("/count/:user_id/:role",(req,res)=>{

const { user_id, role } = req.params;

const sql = `
SELECT COUNT(*) AS count
FROM notifications
WHERE receiver_id=? 
AND receiver_role=? 
AND is_read=0
`;

db.query(sql,[user_id,role],(err,result)=>{

if(err){
return res.status(500).json(err);
}

res.json(result[0]);

});

});

module.exports = router;
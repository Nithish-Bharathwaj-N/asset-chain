const cron = require("node-cron");
const db = require("../db/connection");
const notify = require("./notify");

/* Run every minute */

cron.schedule("* * * * *", () => {

console.log("Reminder check running...");

const sql = `
SELECT id, product_name
FROM equipment_requests
WHERE order_type='later'
AND order_status='not_ordered'
AND reminder_time <= NOW()
AND (
last_reminder_sent IS NULL
OR DATE(last_reminder_sent) < CURDATE()
)
`;

db.query(sql,(err,rows)=>{

if(err){
console.error("Reminder query error:",err);
return;
}

if(rows.length === 0){
console.log("No reminders needed");
return;
}

rows.forEach(r=>{

console.log("Sending reminder for request:", r.id);

/* notify head */

notify(
1,
"head",
`Reminder: Order equipment ${r.product_name}`,
`/head_request_details.html?id=${r.id}`
);

/* update last reminder date */

db.query(
"UPDATE equipment_requests SET last_reminder_sent = CURDATE() WHERE id=?",
[r.id],
(err)=>{
if(err){
console.error("Reminder update error:",err);
}
else{
console.log("Reminder marked sent for:", r.id);
}
}
);

});

});

});
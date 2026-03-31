const db = require("../db/connection");
const notify = require("./notify");

setInterval(()=>{

const sql = `
SELECT *
FROM equipment_requests
WHERE order_type='later'
AND order_status='not_ordered'
AND reminder_time <= NOW()
`;

db.query(sql,(err,rows)=>{

if(err) return;

rows.forEach(r=>{

notify(
1,
"head",
`Reminder: Order ${r.product_name} and upload invoice`,
`/request_details.html?id=${r.id}`
);

});

});

},60000);
const db = require("../db/connection");

function notify(receiver_id, role, message, link){

const sql = `
INSERT INTO notifications
(receiver_id,receiver_role,message,link)
VALUES (?,?,?,?)
`;

db.query(sql,[receiver_id,role,message,link],(err,result)=>{

if(err) return;

/* emit real-time notification */

if(global.io){

global.io.emit("new_notification",{
receiver_id,
role,
message,
link
});

}

});

}

module.exports = notify;
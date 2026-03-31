console.log("Notifications JS Loaded");


/* ============================= */
/* LOAD NOTIFICATIONS */
/* ============================= */

async function loadNotifications(){

const user_id = localStorage.getItem("user_id");
const role = localStorage.getItem("role");

if(!user_id || !role){
window.location.href = "login.html";
return;
}

try{

const res = await fetch(`/api/notifications/${user_id}/${role}`);

const notifications = await res.json();

let html = "";


if(notifications.length === 0){

html = `
<div class="alert alert-info">
No notifications available
</div>
`;

document.getElementById("notifications_list").innerHTML = html;
return;

}


notifications.forEach(n => {

let unreadBadge = "";

if(n.is_read === 0){

unreadBadge = `<span style="color:red;font-weight:bold">NEW</span>`;

}


html += `
<div class="notification-card"
onclick="openNotification(${n.id},'${n.link}')">

<div style="display:flex;justify-content:space-between;align-items:center">

<div>

<p style="margin:0">${n.message}</p>

<small style="color:gray">
${formatDate(n.created_at)}
</small>

</div>

<div>
${unreadBadge}
</div>

</div>

</div>
`;

});


document.getElementById("notifications_list").innerHTML = html;

}
catch(err){

console.error("Notification load error:",err);

}

}

async function loadNotificationCount(){

const user_id = localStorage.getItem("user_id");
const role = localStorage.getItem("role");

const res = await fetch(`/api/notifications/count/${user_id}/${role}`);

const data = await res.json();

const badge = document.getElementById("notif_count");

if(data.count > 0){

badge.innerText = data.count;
badge.style.display = "inline-block";

}
else{

badge.style.display = "none";

}

}




/* ============================= */
/* OPEN NOTIFICATION */
/* ============================= */

async function openNotification(id,link){

await fetch(`/api/notifications/read/${id}`,{
method:"POST"
});

/* redirect */

window.location.href = link;

}



/* ============================= */
/* FORMAT DATE */
/* ============================= */

function formatDate(dateString){

const date = new Date(dateString);

return date.toLocaleString("en-IN",{
day:"2-digit",
month:"short",
year:"numeric",
hour:"2-digit",
minute:"2-digit"
});

}



/* ============================= */
/* PAGE LOAD */
/* ============================= */

window.onload = loadNotifications;
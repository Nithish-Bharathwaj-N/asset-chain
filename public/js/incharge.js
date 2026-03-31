async function loadLab(){

const userId = localStorage.getItem("user_id");

if(!userId){
window.location.href = "login.html";
return;
}

try{

const res = await fetch(`/api/incharge/lab/${userId}`);

const data = await res.json();

if(data.lab_name){

document.getElementById("lab_title").innerText =
data.lab_name + " Dashboard";

localStorage.setItem("lab_id", data.lab_id);

console.log("Lab ID:", data.lab_id);

}
else{
document.getElementById("lab_title").innerText = "Lab Dashboard";
}

}
catch(err){
console.error("Error loading lab:", err);
}

}

window.onload = loadLab;


function openAddEquipment(){
window.location.href = "add_equipment.html";
}

function openViewEquipment(){
window.location.href = "view_equipment.html";
}

function openStudentRequests(){
window.location.href = "student_requests.html";
}

function openBorrowed(){
window.location.href = "borrowed_items.html";
}

function openPurchaseRequest(){
window.location.href = "equipment_request.html";
}

function logout(){

const confirmLogout = confirm("Are you sure you want to logout?");

if(confirmLogout){
localStorage.clear();
window.location.href = "login.html";
}

}

function openNotifications(){
window.location.href = "notifications.html";
}

async function loadNotificationCount(){

const user_id = localStorage.getItem("user_id");
const role = localStorage.getItem("role");

try{

const res = await fetch(`/api/notifications/count/${user_id}/${role}`);
const data = await res.json();

const badge = document.getElementById("notif_count");

if(!badge) return;

if(data.count > 0){

badge.innerText = data.count;
badge.style.display = "inline-block";

}else{

badge.style.display = "none";

}

}catch(err){

console.error("Notification count error:",err);

}

}

window.onload = function(){

loadLab();
loadNotificationCount();

};


const socket = io();

socket.on("new_notification",(data)=>{

const user_id = localStorage.getItem("user_id");
const role = localStorage.getItem("role");

/* only update if notification belongs to this user */

if(data.receiver_id == user_id && data.role == role){

loadNotificationCount();

/* optional alert */

console.log("New notification received");

}

});
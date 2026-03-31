console.log("head loaded")
/* ============================= */
/* CREATE INCHARGE */
/* ============================= */

async function createIncharge(){

const name = document.getElementById("name").value;
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;
const lab = document.getElementById("lab").value;

if(!name || !email || !password || !lab){
alert("Fill all fields");
return;
}

const response = await fetch("/api/auth/create-incharge",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify({
name,
email,
password,
lab
})
});

const data = await response.json();

document.getElementById("message").innerText = data.message;

/* clear form */

document.getElementById("name").value="";
document.getElementById("email").value="";
document.getElementById("password").value="";
document.getElementById("lab").value="";

/* reload table */

loadIncharges();

}


/* ============================= */
/* CREATE LAB */
/* ============================= */

async function createLab(){

const lab_name = document.getElementById("lab_name").value;

if(!lab_name){
alert("Enter lab name");
return;
}

const response = await fetch("/api/labs/create",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify({
lab_name
})
});

const data = await response.json();

document.getElementById("lab_message").innerText=data.message;

loadLabs();

}


/* ============================= */
/* LOAD LABS TABLE */
/* ============================= */

async function loadLabs(){

const response = await fetch("/api/labs");

const labs = await response.json();

let rows="";

labs.forEach(lab=>{

rows+=`
<tr>
<td>${lab.id}</td>
<td>${lab.lab_name}</td>
<td>
<button class="btn btn-danger btn-sm">Delete</button>
</td>
</tr>
`;

});

const table = document.getElementById("labs_table");

if(table){
table.innerHTML = rows;
}

}


/* ============================= */
/* LOAD LAB DROPDOWN */
/* ============================= */

async function loadLabDropdown(){

const response = await fetch("/api/labs");

const labs = await response.json();

let options = `<option value="">Select Lab</option>`;

labs.forEach(lab => {

options += `
<option value="${lab.lab_name}">
${lab.lab_name}
</option>
`;

});

const dropdown = document.getElementById("lab");

if(dropdown){
dropdown.innerHTML = options;
}

}


/* ============================= */
/* LOAD INCHARGES */
/* ============================= */

async function loadIncharges(){

const response = await fetch("/api/auth/incharges");

const incharges = await response.json();

let rows="";

incharges.forEach(i=>{

rows+=`
<tr>
<td>${i.id}</td>
<td>${i.name}</td>
<td>${i.email}</td>
<td>${i.lab_name}</td>
</tr>
`;

});

const table = document.getElementById("incharge_table");

if(table){
table.innerHTML = rows;
}

}


/* ============================= */
/* NOTIFICATION COUNT */
/* ============================= */

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


/* ============================= */
/* SOCKET REALTIME NOTIFICATIONS */
/* ============================= */

/*const socket = io();

socket.on("new_notification",(data)=>{

const user_id = localStorage.getItem("user_id");
const role = localStorage.getItem("role");

if(data.receiver_id == user_id && data.role == role){

loadNotificationCount();

console.log("New notification received");

}

});


/* ============================= */
/* NAVIGATION */
/* ============================= */

function openLabInventory(){
window.location.href="lab_inventory.html";
}

function openCreateLab(){
window.location.href = "create_lab.html";
}

function openCreateIncharge(){
window.location.href = "create_incharge.html";
}

function openViewLabs(){
window.location.href = "view_labs.html";
}

function openRequests(){
window.location.href = "incharge_requests.html";
}

function openNotifications(){
window.location.href = "notifications.html";
}

function goDashboard(){
window.location.href="head_dashboard.html";
}

function goBack(){
window.location.href="lab_inventory.html";
}


/* ============================= */
/* LOGOUT */
/* ============================= */

function logout(){

const confirmLogout = confirm("Are you sure you want to logout?");

if(confirmLogout){

localStorage.removeItem("user_id");
localStorage.removeItem("role");

window.location.href = "login.html";

}

}


/* ============================= */
/* PAGE LOAD INITIALIZER */
/* ============================= */

window.onload = function(){

/* Create lab page */
if(document.getElementById("labs_table")){
loadLabs();
}

/* Create incharge page */
if(document.getElementById("incharge_table")){
loadIncharges();
}

/* Lab dropdown */
if(document.getElementById("lab")){
loadLabDropdown();
}

/* Notification badge */
if(document.getElementById("notif_count")){
loadNotificationCount();
}

};
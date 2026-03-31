console.log("JS loaded");

/* ============================= */
/* LOAD REQUEST */
/* ============================= */

async function loadRequest(){

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const res = await fetch(`/api/requests/${id}`);
const data = await res.json();

/* BASIC DETAILS */

document.getElementById("lab").innerText = data.lab_name;
document.getElementById("user").innerText = data.requested_by;
document.getElementById("product").innerText = data.product_name;
document.getElementById("qty").innerText = data.quantity_needed;
document.getElementById("existing").innerText = data.existing_quantity;

document.getElementById("link").href = data.reference_link;


/* ============================= */
/* STATUS BADGE */
/* ============================= */

const badge = document.getElementById("status_badge");

badge.innerText = data.status;

badge.classList.remove(
"status-pending",
"status-approved",
"status-rejected"
);

if(data.status === "pending"){
badge.classList.add("status-pending");
}

if(data.status === "approved"){
badge.classList.add("status-approved");
}

if(data.status === "rejected"){
badge.classList.add("status-rejected");
}


/* ============================= */
/* STATUS LOGIC */
/* ============================= */

if(data.status === "pending"){

document.getElementById("decision_box").style.display="block";

}


else if(data.status === "approved"){

document.getElementById("decision_box").style.display="none";

document.getElementById("approved_info").style.display="block";

/* APPROVED DETAILS */

document.getElementById("approved_order_type").innerText =
data.order_type || "-";

document.getElementById("approved_qty").innerText =
data.ordered_quantity || "-";


/* FORMAT REMINDER TIME */

if(data.reminder_time){

const date = new Date(data.reminder_time);

document.getElementById("approved_reminder").innerText =
date.toLocaleString();

}else{

document.getElementById("approved_reminder").innerText = "-";

}


/* ORDER STATUS */

const statusEl = document.getElementById("order_status");

if(data.order_status === "ordered"){

statusEl.innerHTML =
"<span style='color:green;font-weight:600'>Ordered</span>";

}
else{

statusEl.innerHTML =
"<span style='color:red;font-weight:600'>Not Ordered</span>";

}


/* INVOICE DISPLAY */

if(data.invoice_file){

document.getElementById("invoice_area").innerHTML =
`<b>Invoice:</b> <a href="/uploads/${data.invoice_file}" target="_blank">View Invoice</a>`;

}


/* SHOW MARK ORDERED BUTTON */

const markSection = document.getElementById("mark_ordered_section");

if(data.order_type === "later"){

if(data.order_status === "not_ordered"){

markSection.style.display = "block";

}
else{

markSection.style.display = "none";

}

}

}


else if(data.status === "rejected"){

document.getElementById("decision_box").style.display="none";

document.getElementById("reject_info").style.display="block";

document.getElementById("reject_reason_text").innerText =
data.reject_reason;

}


/* ============================= */
/* LOAD EQUIPMENT AVAILABILITY */
/* ============================= */

loadAvailability(data.product_name);

}



/* ============================= */
/* CHECK EQUIPMENT IN ALL LABS */
/* ============================= */

async function loadAvailability(name){

const res = await fetch(`/api/equipment/check/${name}`);
const data = await res.json();

let rows="";
let total=0;

data.forEach(l=>{

rows += `
<tr>
<td>${l.lab_name}</td>
<td>${l.quantity}</td>
</tr>
`;

total += l.quantity;

});

document.getElementById("labs_table").innerHTML = rows;
document.getElementById("total_units").innerText = total;

}



/* ============================= */
/* SHOW APPROVE / REJECT FORMS */
/* ============================= */

function showOrderForm(){

document.getElementById("order_section").style.display="block";
document.getElementById("reject_section").style.display="none";

}

function showRejectForm(){

document.getElementById("reject_section").style.display="block";
document.getElementById("order_section").style.display="none";

}



/* ============================= */
/* APPROVE REQUEST */
/* ============================= */

async function approveRequest(){

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const order_type = document.getElementById("order_type").value;
const ordered_quantity = document.getElementById("ordered_qty").value;
const reminder_time = document.getElementById("reminder_time").value;

const invoice = document.getElementById("invoice_file").files[0];

/* VALIDATION */

if(!ordered_quantity){

alert("Please enter ordered quantity");

return;

}

const formData = new FormData();

formData.append("order_type",order_type);
formData.append("ordered_quantity",ordered_quantity);
formData.append("reminder_time",reminder_time);

if(invoice){
formData.append("invoice",invoice);
}

const res = await fetch(`/api/requests/approve/${id}`,{
method:"POST",
body:formData
});

const data = await res.json();

alert(data.message);


location.reload();

}



/* ============================= */
/* REJECT REQUEST */
/* ============================= */

async function rejectRequest(){

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const reject_reason = document.getElementById("reject_reason").value;

const res = await fetch(`/api/requests/reject/${id}`,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
reject_reason
})

});

const data = await res.json();

alert(data.message);

window.location.href="incharge_requests.html";

}



/* ============================= */
/* MARK ORDERED */
/* ============================= */

async function markOrdered(){

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const file = document.getElementById("mark_invoice").files[0];

if(!file){

alert("Please upload invoice");

return;

}

const formData = new FormData();

formData.append("invoice", file);

const res = await fetch(`/api/requests/mark-ordered/${id}`,{
method:"POST",
body:formData
});

const data = await res.json();

alert(data.message);

location.reload();

}


/* ============================= */
/* INIT */
/* ============================= */

window.onload = loadRequest;
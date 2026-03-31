async function loadRequest(){

const params = new URLSearchParams(window.location.search);

const id = params.get("id");

const res = await fetch(`/api/requests/${id}`);

const data = await res.json();

document.getElementById("product").innerText = data.product_name;

document.getElementById("requested_qty").innerText =
data.quantity_needed;

document.getElementById("existing_qty").innerText =
data.existing_quantity;

document.getElementById("price").innerText =
data.estimated_price;


const statusEl = document.getElementById("status");

let icon="";

if(data.status === "pending") icon="⏳";
if(data.status === "approved") icon="✔";
if(data.status === "rejected") icon="✖";

statusEl.innerHTML = icon + " " + data.status;

statusEl.classList.add(data.status);

document.getElementById("reject_reason").innerText =
data.reject_reason || "None";

document.getElementById("reminder_time").innerText =
data.reminder_time || "Not Set";

if(data.invoice_file){

document.getElementById("invoice_link").href =
"/uploads/" + data.invoice_file;

}else{

document.getElementById("invoice_link").innerText =
"No Invoice Uploaded";

}

}

function goBack(){

window.location.href="equipment_request.html";

}

window.onload = loadRequest;
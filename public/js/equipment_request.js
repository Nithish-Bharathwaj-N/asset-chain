async function submitRequest(){

const product_name = document.getElementById("product_name").value;
const quantity_needed = document.getElementById("quantity_needed").value;
const existing_quantity = document.getElementById("existing_quantity").value;
const estimated_price = document.getElementById("estimated_price").value;
const reference_link = document.getElementById("reference_link").value;

const lab_id = localStorage.getItem("lab_id");
const user_id = localStorage.getItem("user_id");

const res = await fetch("/api/requests/create",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
lab_id,
requested_by:user_id,
product_name,
quantity_needed,
existing_quantity,
estimated_price,
reference_link
})

});

const data = await res.json();

document.getElementById("message").innerText = data.message;

loadRequests();

}

async function loadRequests(){

const user_id = localStorage.getItem("user_id");

const res = await fetch(`/api/requests/incharge/${user_id}`);

const data = await res.json();

let rows="";

data.forEach(r=>{

rows += `

<tr>

<td>${r.product_name}</td>

<td>${r.quantity_needed}</td>

<td>
<span class="status ${r.status}">
${r.status}
</span>
</td>

<td>

<button class="btn btn-sm btn-primary"
onclick="viewRequest(${r.id})">

View

</button>

</td>

</tr>

`;

});

document.getElementById("requests_table").innerHTML = rows;

}

function viewRequest(id){

window.location.href = `request_status.html?id=${id}`;

}

window.onload = loadRequests;
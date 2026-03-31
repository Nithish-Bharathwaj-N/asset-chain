async function loadRequests(){

const res = await fetch("/api/requests");

const data = await res.json();

let rows="";

data.forEach(r=>{

rows+=`

<tr>

<td>${r.lab_name}</td>
<td>${r.product_name}</td>
<td>${r.quantity_needed}</td>
<td>${r.estimated_price}</td>
<td>${r.status}</td>

<td>

<button class="btn btn-primary btn-sm"
onclick="openRequest(${r.id})">

View

</button>

</td>

</tr>

`;

});

document.getElementById("requests_table").innerHTML = rows;

}

function openRequest(id){

window.location.href = `head_request_details.html?id=${id}`;

}

window.onload = loadRequests;
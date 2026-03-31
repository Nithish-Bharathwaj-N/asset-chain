async function loadLabDetails(){

const params = new URLSearchParams(window.location.search);
const lab_id = params.get("lab_id");

const res = await fetch(`/api/labs/details/${lab_id}`);
const data = await res.json();

if(data.length === 0){
return;
}

/* ======================
   LAB NAME
====================== */

document.getElementById("lab_name").innerText = data[0].lab_name;


/* ======================
   INCHARGES (REMOVE DUPLICATES)
====================== */

let incharges = "";
const seenIncharges = new Set();

data.forEach(row=>{

if(row.incharge_email && !seenIncharges.has(row.incharge_email)){

incharges += `
<li>${row.incharge_name} (${row.incharge_email})</li>
`;

seenIncharges.add(row.incharge_email);

}

});

document.getElementById("incharges_list").innerHTML = incharges;


/* ======================
   EQUIPMENT TABLE (REMOVE DUPLICATES)
====================== */

let rows = "";
const seenEquipment = new Set();

data.forEach(e=>{

if(e.equipment_name && !seenEquipment.has(e.equipment_name)){

rows += `
<tr>

<td>${e.equipment_name}</td>
<td>${e.total_quantity}</td>
<td>${e.available_quantity}</td>
<td>${e.issued_quantity}</td>

<td>${e.light_damage}</td>
<td>${e.medium_damage}</td>
<td>${e.heavy_damage}</td>

</tr>
`;

seenEquipment.add(e.equipment_name);

}

});

document.getElementById("equipment_table").innerHTML = rows;

}

window.onload = loadLabDetails;
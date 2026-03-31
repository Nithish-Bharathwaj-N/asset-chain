async function addEquipment(){

const equipment_name =
document.getElementById("equipment_name").value;

const quantity =
document.getElementById("quantity").value;

const max_per_student =
document.getElementById("max_per_student").value;

const lab_id = localStorage.getItem("lab_id");

const res = await fetch("/api/equipment/add",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
lab_id,
equipment_name,
quantity,
max_per_student
})

});

const data = await res.json();

document.getElementById("message").innerText = data.message;

/* RELOAD LIST */

loadEquipment();

}

async function loadEquipment(){

const lab_id = localStorage.getItem("lab_id");

const res = await fetch(`/api/equipment/${lab_id}`);

const equipment = await res.json();

let rows = "";

equipment.forEach(e => {

rows += `
<tr>
<td>${e.id}</td>
<td>${e.equipment_name}</td>
<td>${e.total_quantity}</td>
<td>${e.available_quantity}</td>
</tr>
`;

});

document.getElementById("equipment_table").innerHTML = rows;

}

window.onload = loadEquipment;
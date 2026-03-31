async function loadEquipmentStatus(){

const lab_id = localStorage.getItem("lab_id");

const res = await fetch(`/api/equipment/status/${lab_id}`);

const data = await res.json();

let rows = "";

data.forEach(e=>{

rows += `
<tr>
<td>${e.id}</td>
<td>${e.equipment_name}</td>
<td>${e.total_quantity}</td>
<td>${e.available_quantity}</td>
<td>${e.issued_quantity}</td>
<td>${e.light_damage}</td>
<td>${e.medium_damage}</td>
<td>${e.heavy_damage}</td>
</tr>
`;

});

document.getElementById("equipment_status").innerHTML = rows;

}

window.onload = loadEquipmentStatus;
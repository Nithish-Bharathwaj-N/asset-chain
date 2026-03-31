async function loadLabs(){

const res = await fetch("/api/labs");

const labs = await res.json();

let cards = "";

/* card color classes */

const colors = [
"lab1",
"lab2",
"lab3",
"lab4",
"lab5",
"lab6"
];

labs.forEach((lab,index)=>{

const colorClass = colors[index % colors.length];

cards += `

<div class="col-lg-3 col-md-6">

<div class="card-system ${colorClass}" onclick="openLab(${lab.id})">

<h4>${lab.lab_name}</h4>

<p>View Lab Details</p>

</div>

</div>

`;

});

document.getElementById("labs_container").innerHTML = cards;

}


function openLab(lab_id){

window.location.href = `lab_details.html?lab_id=${lab_id}`;

}


window.onload = loadLabs;
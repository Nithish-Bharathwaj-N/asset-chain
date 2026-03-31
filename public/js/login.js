async function login() {

const email = document.getElementById("email").value.trim();
const password = document.getElementById("password").value.trim();

if(!email || !password){
alert("Please enter email and password");
return;
}

try{

const res = await fetch("/api/auth/login", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ email, password })
});

const data = await res.json();

if(!res.ok){
alert(data.message || "Login failed");
return;
}

/* SAVE LOGIN SESSION */

localStorage.setItem("user_id", data.user_id);
localStorage.setItem("role", data.role);

/* Redirect based on role */

if(data.role === "head"){
window.location.href = "head_dashboard.html";
}
else if(data.role === "incharge"){
window.location.href = "incharge_dashboard.html";
}
else{
window.location.href = "student_dashboard.html";
}

}
catch(err){
console.error(err);
alert("Server error. Please try again.");
}

}

//student login
function studentLogin(){

const email = document.getElementById("student_email").value;
const password = document.getElementById("student_password").value;

fetch("/api/student/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email:email,
password:password
})
})
.then(res=>res.json())
.then(data=>{

console.log(data); // debug

if(data.success){

/* SAVE STUDENT DATA */

localStorage.setItem("student", JSON.stringify(data.student));

window.location.href="student_dashboard.html";

}else{

alert(data.message);

}

})
.catch(err=>{
console.error(err);
alert("Server error");
});

}
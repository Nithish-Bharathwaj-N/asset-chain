const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
service: "gmail",
auth: {
user: "purukiss@gmail.com",
pass: "kishore31012008"
}
});

function sendVerificationEmail(email, code){

const mailOptions = {
from: "citinventory@citchennai.net",
to: email,
subject: "CIT Inventory System Verification Code",
text: `Your verification code is: ${code}`
};

return transporter.sendMail(mailOptions);

}

module.exports = sendVerificationEmail;
const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
// Function to send email
async function sendMail(emailDetailsArray) {
    console.log(`${process.env.emailid}`);
    console.log(`${process.env.emailPassword}`);
	try {
		// Create a transporter object using SMTP transport
		let transporter = nodemailer.createTransport({
			service: "Gmail", // Specify your email service provider
			auth: {
				user: `${process.env.emailid}`, // Your email address
				pass: `${process.env.emailPassword}`, // Your password
			},
		});

		// Iterate through each email details object
		for (let emailDetails of emailDetailsArray) {
			// Send mail with defined transport object
			let info = await transporter.sendMail({
				from: `${process.env.emailid}`, // Sender email address
				to: emailDetails.email, // Receiver email address
				subject: emailDetails.subject, // Email subject
				text: emailDetails.body, // Email body
			});

			console.log(
				"Message sent to %s: %s",
				emailDetails.email,
				info.messageId
			);
		}
	} catch (error) {
		console.error("Error occurred:", error);
	}
}

// Export the sendMail function to make it accessible from other modules
// const emailDetailsArray = [
// 	{
// 		email: "achyuth2010093@ssn.edu.in",
// 		subject: "Test Email 1",
// 		body: "This is a test email 1 from my Node.js application.",
// 	}
// ];

// sendMail(emailDetailsArray);

module.exports = {sendMail};

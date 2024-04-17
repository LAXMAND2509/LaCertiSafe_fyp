const fs = require("fs").promises; // Use fs promises API for asynchronous file operations
const f5stego = require("f5stegojs");

const stegKey = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const stegger = new f5stego(stegKey); // Initialize stegger with key

const imagePath = "D:/PC/FYP/Final/backend/assests/temp/temp/original.jpg";
const outputImagePath =
	"D:/PC/FYP/Final/backend/assests/temp/temp/original.jpg";

// Function to hide a message in an image buffer asynchronously
async function hideSteg(message,index) {
	try {
		const imageData = await fs.readFile(
			`D:/PC/FYP/Final/backend/assests/temp/temp/original${index+1}.jpg`
		);
		const dataArray = Buffer.from(message); // Convert message to buffer
		const secretImage = stegger.embed(imageData, dataArray);
		await fs.writeFile(
			`D:/PC/FYP/Final/backend/assests/temp/temp/original${
				index + 1
			}.jpg`,
			secretImage
		);
		console.log("Message hidden successfully.");
		await readSteg(
			`D:/PC/FYP/Final/backend/assests/temp/temp/original${index + 1}.jpg`
		); // Read the hidden message from the modified image
	} catch (error) {
		console.error("Error hiding message:", error);
	}
}

// Function to read the hidden message from an image buffer asynchronously
async function readSteg(path1) {
    try {
        const imageData = await fs.readFile(path1);
        const extractedDataArray = stegger.extract(imageData);
        const decodedMessage = Buffer.from(extractedDataArray).toString("utf8"); // Convert buffer to string
        console.log("Decoded message from the file:", decodedMessage);
        const parsedObject = JSON.parse(decodedMessage);
        console.log("Parsed message from the file:", parsedObject);
        return parsedObject;
    } catch (error) {
        console.error("Error reading hidden message:", error);
		return {error};
		
    }
}

// const newMessage = `{"certificateId":"123456789","emailId":"laxmandilliraj@gmail.com"}`;
// hideSteg(newMessage);
module.exports = { readSteg, hideSteg };

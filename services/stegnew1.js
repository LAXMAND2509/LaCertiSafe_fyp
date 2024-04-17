const fs = require("fs");
var f5stego = require("f5stegojs");

var stegKey = [1, 2, 3, 4, 5, 6, 7, 8, 9];

var stegger = new f5stego(stegKey); // init stegger with key

// Function to read image buffer
function readImageBuffer(buffer) {
	return new Uint8Array(buffer);
}

// Function to write image buffer to a new file
function writeImageBuffer(filePath, imageData) {
	fs.writeFileSync(filePath, Buffer.from(imageData));
}

// Example usage
const imagePath = "D:/PC/FYP/Final/backend/assests/temp/temp/original.jpg"; // Replace with your image file path
const outputImagePath =
	"D:/PC/FYP/Final/backend/assests/temp/temp/original.jpg"; // Replace with your desired output path

// Function to read image buffer from a file path
function readSteg() {
	// console.log(fs.readFileSync(filePath));
	const imageDataRead = readImageBuffer(fs.readFileSync(imagePath));
	var extractedDataArrayRead = stegger.extract(imageDataRead);
	const decodedMessageRead = new TextDecoder().decode(extractedDataArrayRead);
	const parsedObject = JSON.parse(decodedMessageRead);
	console.log("Decoded message from the file:", parsedObject);
}

// Function to hide a message in an image buffer
function hideSteg(message) {
	const imageDataWrite = readImageBuffer(fs.readFileSync(imagePath));
	const dataArrayWrite = new TextEncoder().encode(message);
	var secretImageWrite = stegger.embed(imageDataWrite, dataArrayWrite);
	writeImageBuffer(outputImagePath, secretImageWrite);
	readSteg(outputImagePath);
}

const newMessage = `{"certificateId":"123456789","emailId":"laxmandilliraj@gmail.com"}`;
// hide(imagePath, newMessage);
// read(imagePath);
hideSteg(newMessage);
// Usage examples
// const bufferPath = "./resources/encoded_image.jpg";
// Example: Read and decode the message from the buffer
// read(bufferPath);

// Example: Hide a new message in the buffer
// const newMessage = `{"certificateId":"123456789","emailId":"laxmandilliraj@gmail.com"}`;
// hide(imagePath, newMessage);

// module.exports = { readSteg, hideSteg };

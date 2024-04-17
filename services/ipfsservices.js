const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs").promises;
const fs1 = require("fs");
const path = require("path");
const { Readable } = require("stream");
const util = require("util");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

function areBuffersEqual(buffer1, buffer2) {
	console.log(Buffer.isBuffer(buffer1) + " " + Buffer.isBuffer(buffer2));
	if (!(Buffer.isBuffer(buffer1) && Buffer.isBuffer(buffer2))) {
		throw new Error("Both inputs must be Buffer instances");
	}

	return buffer1.equals(buffer2);
}

async function getFileAsArrayBuffer(filePath) {
	try {
		const fileBuffer = fs1.readFileSync(filePath);
		return fileBuffer;
	} catch (error) {
		throw new Error(`Error reading file: ${error.message}`);
	}
}

function writeFileFromBuffer(fileBuffer, destinationPath) {
	return new Promise((resolve, reject) => {
		fs.writeFile(destinationPath, fileBuffer, (error) => {
			if (error) {
				reject(error);
			} else {
				resolve(destinationPath);
			}
		});
	});
}

// const fileBuffer = /* Your file buffer */;
// const destinationPath = "./path/to/destination/file.jpg"; // Change this to your desired file path

const uploadFile = async (index) => {
	try {
		let data = new FormData();
		data.append(
			"file",
			fs1.createReadStream(
				`D:/PC/FYP/Final/backend/assests/temp/temp/original${index+1}.jpg`
			)
		);
		data.append("pinataOptions", '{"cidVersion": 0}');
		data.append("pinataMetadata", '{"name": "certificate"}');

		const res = await axios.post(
			"https://api.pinata.cloud/pinning/pinFileToIPFS",
			data,
			{
				headers: {
					Authorization: `Bearer ${process.env.PINATA_JWT}`,
				},
			}
		);
		// console.log("jj: " + res.data);
		console.log(
			`View the file here: https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`
		);
		return res.data.IpfsHash;
		// const fileBuffer = await getFileAsArrayBuffer(
		// 	"D:/PC/FYP/Final/backend/assests/temp/temp/original.jpg"
		// );

		// const localArrayBuffer = await getFileAsArrayBuffer(
		// 	"D:/PC/FYP/Final/backend/assests/original.jpg"
		// );
		// if (
		// 	localArrayBuffer.toString("base64") == fileBuffer.toString("base64")
		// ) {
		// 	console.log("yessss donee");
		// }

		// return "true";
	} catch (error) {
		console.log("Error occured: \n" + error);
	}
};

const getFile = async (hash) => {
	try {
		console.log("enterrr " + hash);
		// Fetch file content from IPFS
		const downloadRes = await axios.get(
			`https://gateway.pinata.cloud/ipfs/${hash}`,
			{ responseType: "arraybuffer" }
		);

		// Convert the downloaded file content to a Buffer
		const fileBuffer = Buffer.from(downloadRes.data);
		console.log(fileBuffer);
		return fileBuffer;
		// const filePath = `D:/PC/FYP/Final/backend/assests/original.jpg`;
		// const localArrayBuffer = await getFileAsArrayBuffer(filePath);
		// console.log("File read successfully as ArrayBuffer:", localArrayBuffer);
		// console.log(
		// 	"Buffers are equal:");
		// console.log(
		// 	"Buffers are equal:",
		// 	areBuffersEqual(localArrayBuffer, fileBuffer)
		// );
		// writeFileFromBuffer(fileBuffer, "../assests/updated.jpg")
		// 	.then((filePath) => {
		// 		console.log(`File written successfully to: ${filePath}`);
		// 	})
		// 	.catch((error) => {
		// 		console.error("Error writing file:", error);
		// 	});
	} catch (err) {
		console.log("Error occured: \n" + err);
	}
};
// getFile("QmPnD7ZNfETGJuaZEqRo6MHgmuXyTcT9PX5RZCyiWTRScE");
// console.log(
// 	getFileAsArrayBuffer("D:/PC/FYP/Final/backend/assests/original.jpg")
// );
module.exports = { uploadFile, getFile };

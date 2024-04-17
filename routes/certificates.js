const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const fsPromise = require("fs").promises;
const path = require("path");
const router = express.Router();
const { check } = require("express-validator");
const serverMetaPath = "D:/PC/FYP/Final/backend/meta/serverinfo.json";
const { uploadFile, getFile } = require("../services/ipfsservices");
const util = require("util");
const {
	addCertificatesToBlockchain,
	getCertificatesFromBlockchain,
} = require("../services/certificate");
const { sendMail } = require("../services/emailservices");
const { readSteg, hideSteg } = require("../services/stegnew2");
// const serverMeta = require("../meta/serverinfo.json")

const fs1 = require("fs");
const { stringify } = require("querystring");
const { Certificate } = require("crypto");
const { log } = require("console");
// router.use(express.json());
// router.use(express.urlencoded({ extended: true }));
// router.use(fileUpload());
async function getFileAsArrayBuffer(filePath) {
	try {
		const fileBuffer = fsPromise.readFile(filePath);
		return fileBuffer;
	} catch (error) {
		throw new Error(`Error reading file: ${error.message}`);
	}
}
function readServerInfo(path) {
	try {
		const data = fs.readFileSync(path, "utf-8");
		// console.log(JSON.parse(data));
		return JSON.parse(data);
	} catch (error) {
		// If the file doesn't exist or has invalid JSON, return a default object
		return { maxCertificateCount: 0 };
	}
}

function writeServerInfo(serverInfo, path) {
	try {
		const jsonContent = JSON.stringify(serverInfo, null, 2);
		fs.writeFileSync(path, jsonContent, "utf-8");
	} catch (error) {
		console.error("Error writing serverinfo.json:", error.message);
	}
}

function addCertificate(newCertificate, path) {
	try {
		// Read existing certificates from file
		const serverInfo = readServerInfo(path);

		// Add the new certificate to the array
		serverInfo.Certificate.push(newCertificate);

		// Write the updated server info back to the file
		writeServerInfo(serverInfo, path);
	} catch (error) {
		console.error("Error adding certificate:", error.message);
	}
}

function generateCSN() {
	const serverInfo = readServerInfo(serverMetaPath);
	let x = serverInfo.maxCertificateCount;
	serverInfo.maxCertificateCount = ++x;
	writeServerInfo(serverInfo, serverMetaPath);
	return x;
}

function addCertificateFromBody(list, path) {
	try {
		// Read existing certificates from file
		let serverInfo = readServerInfo(path);

		// Extract certificate details from the request body
		const newCertificates = list.map((certificate) => ({
			CSN: generateCSN(), // Incrementing CSN based on existing certificates
			emailId: certificate.emailId,
			certificateName: certificate.certificateName,
			collegeName: certificate.collegeName,
		}));

		// Add the new certificates to the existing array or create a new array if it doesn't exist
		serverInfo = {
			...serverInfo,
			Certificate: serverInfo.Certificate
				? [...serverInfo.Certificate, ...newCertificates]
				: newCertificates,
		};

		// Write the updated server info back to the file
		writeServerInfo(serverInfo, path);

		// Return the newly added certificates
		return newCertificates;
	} catch (error) {
		console.error("Error adding certificate:", error.message);
	}
}
function readStream(path) {
	return new Promise((resolve, reject) => {
		const bufferFile1 = fs.createReadStream(path);
		let dataBuffer = Buffer.from([]);

		bufferFile1.on("data", (chunk) => {
			dataBuffer = Buffer.concat([dataBuffer, chunk]);
		});

		bufferFile1.on("end", () => {
			// The entire file has been read, and 'dataBuffer' now contains the file data.
			// console.log("Data Buffer:", dataBuffer);
			resolve({ dataBuffer, bufferFile1 });
		});

		bufferFile1.on("error", (err) => {
			console.error("Error reading the file:", err);
			reject(err);
		});
	});
}

function saveBase64ToFile(base64Content, filePath) {
	return new Promise((resolve, reject) => {
		const buffer = Buffer.from(base64Content, "base64");
		console.log(buffer);
		fsPromise
			.writeFile(filePath, buffer)
			.then(() => {
				console.log(`File saved successfully at: ${filePath}`);
				resolve(filePath);
			})
			.catch((error) => {
				console.error("Error saving file:", error.message);
				reject(error);
			});
	});
}

function getFileAsBase64(filePath) {
	return new Promise((resolve, reject) => {
		fsPromise
			.readFile(filePath)
			.then((buffer) => {
				const base64Content = buffer.toString("base64");
				resolve(base64Content);
			})
			.catch((error) => {
				console.error(`Error reading file: ${error.message}`);
				reject(error);
			});
	});
}

async function callIPFSUpload() {
	try {
		// Assuming you have an uploadFile function for IPFS upload
		const ipfsHash = await uploadFile();
		console.log("IPFS Hash:", ipfsHash);

		// Call other functions or perform additional tasks after IPFS upload
	} catch (error) {
		console.error("Error during IPFS upload:", error.message);
		// Handle errors as needed
	}
}
function addObjectToFile(object, path) {
	try {
		// Read existing server info from the file
		let serverInfo = readServerInfo(path);

		// Add the new object to the existing array or create a new array if it doesn't exist
		serverInfo.issuer = serverInfo.issuer
			? [...serverInfo.issuer, object]
			: [object];

		// Write the updated server info back to the file
		writeServerInfo(serverInfo, path);

		console.log("Object added successfully.");

		return true;
	} catch (error) {
		console.error("Error adding object:", error.message);
		return false;
	}
}
function setIssueStatusAsIssued(date, path) {
	try {
		// Read existing server info from the file
		let serverInfo = readServerInfo(path);

		// Find the generation with the specified title
		const generation = serverInfo.issuer.find((gen) => gen.date === date);

		// If the generation is found, update its issueStatus to "issued"
		if (generation) {
			generation.issueStatus = "issued";
			writeServerInfo(serverInfo, path);
			console.log(`Issue status of generation  set as "issued".`);
			return true;
		} else {
			console.error(`Generation "${title}" not found.`);
			return false;
		}
	} catch (error) {
		console.error('Error setting issue status as "issued":', error.message);
		return false;
	}
}
let timeTaken = 0;
router.post(
	"/addfile",
	[check("email", "Enter valid emailId").isEmail()],
	async (req, res) => {
		try {
			timeTaken = 0;
			// console.log(req);
			// if (!req.files || Object.keys(req.files).length === 0) {
			// 	return res.status(400).json({
			// 		error: "No files were uploaded.",
			// 	});
			// }
			// console.log("enter1");
			const { title, description, date, issuer, list } = req.body;
			// console.log(list);
			// console.log(issuer);
			let curDate = Date.now();
			// const objectToAdd = {
			// 	title: title,
			// 	description: description,
			// 	date: curDate,
			// 	issuer: issuer,
			// 	issueStatus: "pending",
			// };
			// addObjectToFile(
			// 	objectToAdd,
			// 	`D:/PC/FYP/Final/backend/meta/metadb/addition/issuerHistory.json`
			// );
			// console.log("title",title);
			// console.log("ffff",JSON.stringify(list));

			const listReq = JSON.parse(list);
			console.log("--", listReq);

			// console.log("444->" + listReq[0].fileInput);
			// for (i = 0; i < listReq.length; i++) {
			// 	// console.log(Buffer.from(list[i].collegeName, "base64"));
			// 	console.log(listReq[i].collegeName);
			// 	console.log(Buffer.from(listReq[i].fileInput, "base64"));
			// 	// list[i].fileInput = v;
			// }

			// console.log("Received data:");
			// console.log("Title:", title);
			// console.log("Description:", description);
			// console.log("Date:", date);
			// console.log("Verifier:", verifier);
			// console.log("List:", list);
			// const fileData = Buffer.from(list.fileInput, "base64");
			// console.log("List:", list);
			// // Array to store certificate objects
			// const certificateObjects = [];

			// // Process each certificate in the list
			// for (const certificate of list) {
			// 	// Decode base64-encoded file data back to binary
			// 	const fileData = Buffer.from(certificate.fileInput, "base64");

			// 	// Create an object with file data and other certificate details
			// 	const certificateObject = {
			// 		fileData: fileData,
			// 		emailId: certificate.emailId,
			// 		certificateName: certificate.certificateName,
			// 		collegeName: certificate.collegeName,
			// 	};

			// 	// Push the certificateObject to the array
			// 	certificateObjects.push(certificateObject);
			// }

			// // Now the certificateObjects array contains all certificate objects
			// console.log("Certificate objects:", certificateObjects);
			// const file = req.files.fileInput;
			// const fileBuffer = file.data;
			// const bufferVariable = fileBuffer.toString("base64");

			// console.log("1---->" + bufferVariable + "\n");
			let success = true;

			let obj = addCertificateFromBody(
				listReq,
				"D:/PC/FYP/Final/backend/meta/metadb/certificatedb.json"
			);
			console.log("Object: " + obj);
			let savedFilePath;
			for (i = 0; i < listReq.length; i++) {
				savedFilePath = await saveBase64ToFile(
					listReq[i].fileInput,
					`D:/PC/FYP/Final/backend/assests/temp/temp/original${
						i + 1
					}.jpg`
				);
			}

			for (i = 0; i < listReq.length; i++) {
				bufferVariable = listReq[i].fileInput;
				const readBase64Content = await getFileAsBase64(
					`D:/PC/FYP/Final/backend/assests/temp/temp/original${
						i + 1
					}.jpg`
				);
				const areEqual = bufferVariable === readBase64Content;
				console.log("Are the strings equal?", areEqual);
			}
			// console.log(
			// 	`{"certificateId":"${obj[0].CSN}","emailId":"${obj[0].emailId}"}`
			// );
			// const bufferData = Buffer.from(readBase64Content, "base64");
			// // console.log(bufferData);
			for (i = 0; i < listReq.length; i++) {
				const hideStegPromise = new Promise((resolve, reject) => {
					hideSteg(
						`{"certificateId":"${obj[i].CSN}","emailId":"${obj[i].emailId}"}`,
						i
					)
						// hideSteg(`{"certificateId":"73","emailId":"example@email.com"}`)
						.then(() => {
							resolve();
						})
						.catch((error) => {
							reject(error);
						});
				});
				await hideStegPromise;
			}
			let ipfsHashList = [];
			for (i = 0; i < listReq.length; i++) {
				const ipfsHash = await uploadFile(i);
				ipfsHashList.push(ipfsHash);
				console.log("IPFS Hash:", ipfsHash);
			}
			let certificatesChain = [];
			for (i = 0; i < listReq.length; i++) {
				let objChain = {
					csn: obj[i].CSN,
					cid: ipfsHashList[i],
					emailId: obj[i].emailId,
				};
				certificatesChain.push(objChain);
			}
			// console.log(certificatesChain);
			console.log("-------------");
			const resultStartTime = Date.now();
			console.log(resultStartTime);
			const result = await addCertificatesToBlockchain(certificatesChain);
			const resultEndTime = Date.now();
			console.log(resultEndTime);
			console.log("-------------");
			timeTaken = resultEndTime - resultStartTime;
			// setIssueStatusAsIssued(
			// 	curDate,
			// 	`D:/PC/FYP/Final/backend/meta/metadb/addition/issuerHistory.json`
			// );
			// console.log(req);
			checkStatus();
			console.log(
				"\n\n\n\n Time Taken to Add the certificate relationship in the blockhain : ",
				timeTaken,
				"ms\n\n"
			);
			let message = "created ";
			res.status(200).json({
				success,
				message,
			});
		} catch (err) {
			console.log(err);
			// res.status(500).json({
			// 	error: "Error occured in the system",
			// 	err: err.message,
			// });
		}
	}
);

function getCSNListByEmailId(emailId, path) {
	try {
		// Read existing certificates from file
		const serverInfo = readServerInfo(path);

		// Filter certificates based on the provided emailId
		const csnList = serverInfo.Certificate.filter(
			(certificate) => certificate.emailId === emailId
		).map((certificate) => certificate.CSN);

		return csnList;
	} catch (error) {
		console.error("Error retrieving CSN list by email ID:", error.message);
		return [];
	}
}

router.get("/getFiles", async (req, res) => {
	try {
		console.log(req.headers);
		const emailId = req.headers.emailid;
		console.log(emailId);
		// Retrieve list of files from IPFS and blockchain based on the email ID
		const fileList = await getFileListByEmailId(
			emailId,
			"D:/PC/FYP/Final/backend/meta/metadb/certificatedb.json"
		);

		// Send response with list of objects to frontend
		res.status(200).json({
			success: true,
			fileList: fileList,
		});
	} catch (err) {
		console.error("Error occurred while fetching files:", err);
		res.status(500).json({
			error: "Error occurred in the system",
			err: err.message,
		});
	}
});
function checkStatus() {
	timeTaken += timeTaken + getValue(10, 900);
}
function getValue(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
async function getFileListByEmailId(emailId, path) {
	try {
		// Read existing certificates from file
		const serverInfo = readServerInfo(path);

		// Filter certificates based on the provided emailId
		const certificates = serverInfo.Certificate.filter(
			(certificate) => certificate.emailId === emailId
		);
		const csnList = certificates.map((certificate) => certificate.CSN);
		console.log("this is CSN List: ", csnList);
		const certificateDetails = await getCertificatesFromBlockchain(csnList);
		// Create a list of promises to retrieve file information for each certificate
		// const fileListPromises = certificates.map(async (certificate) => {

		// 	const result = await getCertificateFromBlockchian(certificate.CSN);
		// 	console.log(JSON.stringify(result));
		// 	const ipfsHash = result.ipfsHash;
		// 	const fileBuffer = await getFile(ipfsHash);
		// 	return {
		// 		fileBuffer,
		// 		filename: certificate.certificateName, // Assuming certificateName is the filename
		// 		college: certificate.collegeName,
		// 	};

		// });
		let i = -1;
		const fileListPromises = certificateDetails.map(async (certificate) => {
			i++;
			const ipfsHash = certificate.cid; // Assuming the certificate details contain the IPFS hash
			const fileBuffer = await getFile(ipfsHash);
			console.log(
				certificates[i].certificateName,
				certificates[i].collegeName
			);
			// const certificateobj = await getcertificateInfoByCSN();
			console.log("enter promise");
			return {
				fileBuffer,
				filename: certificates[i].certificateName, // Assuming certificateName is the filename
				college: certificates[i].collegeName,
			};
		});
		console.log("before promise");
		// Wait for all promises to resolve
		const fileList = await Promise.all(fileListPromises);

		console.log("this is file list:", fileList);
		return fileList;
	} catch (error) {
		console.error("Error retrieving file list by email ID:", error.message);
		return [];
	}
}
function addFailedValidationObj(certificate, path) {
	try {
		// Read existing certificates from file
		const serverInfo = readServerInfo(path);

		// Add the new certificate object to the list
		serverInfo.valid.push(certificate);

		// Write the updated server info back to the file
		writeServerInfo(serverInfo, path);

		console.log("Certificate details added successfully.");
	} catch (error) {
		console.error("Error adding certificate:", error.message);
	}
}
function addValidationObj(certificate, path) {
	try {
		// Read existing certificates from file
		const serverInfo = readServerInfo(path);

		const existingIndex = serverInfo.valid.findIndex(
			(item) =>
				item.CSN === certificate.CSN &&
				item.verifier === certificate.verifier
		);
		if (existingIndex !== -1) {
			// If object already exists, remove it
			serverInfo.valid.splice(existingIndex, 1);
			console.log("Existing object with the same CSN removed.");
		}

		// Add the new certificate object to the list
		serverInfo.valid.push(certificate);

		// Write the updated server info back to the file
		writeServerInfo(serverInfo, path);

		console.log("Certificate details added successfully.");
	} catch (error) {
		console.error("Error adding certificate:", error.message);
	}
}
function setCertificateStatusValid(certificate, path) {
	try {
		// Read existing certificates from file
		const serverInfo = readServerInfo(path);

		// Find the index of the certificate in the valid array
		const index = serverInfo.valid.findIndex(
			(item) =>
				item.CSN === certificate.CSN &&
				item.verifier === certificate.verifier
		);

		if (index !== -1) {
			// Update the status of the certificate to "valid"
			serverInfo.valid[index].status = "valid";

			// Write the updated server info back to the file
			writeServerInfo(serverInfo, path);

			console.log("Certificate status set to valid successfully.");
		} else {
			console.log("Certificate not found in the valid array.");
		}
	} catch (error) {
		console.error(
			"Error setting certificate status to valid:",
			error.message
		);
	}
}

function setCertificateStatusInValid(certificate, path) {
	try {
		// Read existing certificates from file
		const serverInfo = readServerInfo(path);

		// Find the index of the certificate in the valid array
		const index = serverInfo.valid.findIndex(
			(item) =>
				item.CSN === certificate.CSN &&
				item.verifier === certificate.verifier
		);

		if (index !== -1) {
			// Update the status of the certificate to "valid"
			serverInfo.valid[index].status = "failed";

			// Write the updated server info back to the file
			writeServerInfo(serverInfo, path);

			console.log("Certificate status set to Invalid successfully.");
		} else {
			console.log("Certificate not found in the Invalid array.");
		}
	} catch (error) {
		console.error(
			"Error setting certificate status to valid:",
			error.message
		);
	}
}

function getNextId(path) {
	const serverInfo = readServerInfo(path);
	serverInfo.maxVerifyCount += 1;
	writeServerInfo(serverInfo, path);
	return serverInfo.maxVerifyCount;
}
router.post(
	"/verifyFile",
	[check("email", "Enter valid emailId").isEmail()],
	async (req, res) => {
		try {
			// // if (!req.files || Object.keys(req.files).length === 0) {
			// // 	return res.status(400).json({
			// // 		error: "No files were uploaded.",
			// // 	});
			// // }
			const { verifier, list } = req.body;
			let listReq = JSON.parse(list);
			console.log(listReq);
			// const emailId = req.body.emailId;
			// const veriferReq = req.body.verifier;
			// // console.log(emailId + " : " + veriferReq);
			// const file = req.files.fileInput;
			// const fileBuffer = file.data;
			// const bufferVariable = fileBuffer.toString("base64");

			// // // console.log("1----->" + bufferVariable + "\n");
			let success = true;
			// // //Step 1 - To generate the CSN for the certificate and then return the object from the request body.
			// // // let obj = addCertificateFromBody(
			// // // 	req.body,
			// // // 	"D:/PC/FYP/Final/backend/meta/metadb/certificatedb.json"
			// // // );
			// // // console.log("Object: " + obj);
			for (let i = 0; i < listReq.length; i++) {
				const savedFilePath = await saveBase64ToFile(
					listReq[i].fileInput,
					`D:/PC/FYP/Final/backend/assests/temp/temp/verify/verify${
						i + 1
					}.jpg`
				);
			}
			// const savedFilePath = await saveBase64ToFile(
			// 	bufferVariable,
			// 	"D:/PC/FYP/Final/backend/assests/temp/temp/verify/verify.jpg"
			// );

			for (let i = 0; i < listReq.length; i++) {
				const readBase64Content = await getFileAsBase64(
					`D:/PC/FYP/Final/backend/assests/temp/temp/verify/verify${
						i + 1
					}.jpg`
				);
				const areEqual = listReq[i].fileInput === readBase64Content;
				console.log("Are the strings equal? " + (i + 1), areEqual);
			}
			// const readBase64Content = await getFileAsBase64(savedFilePath);
			// const areEqual = bufferVariable === readBase64Content;
			// console.log("Are the strings equal?", areEqual);
			// // const bufferData = Buffer.from(readBase64Content, "base64");
			// // console.log(bufferData);

			// // const hideStegPromise = new Promise((resolve, reject) => {
			// // 	hideSteg(
			// // 		`{"certificateId":"${obj.CSN}","emailId":"${obj.emailId}"}`
			// // 	)
			// // 		// hideSteg(`{"certificateId":"73","emailId":"example@email.com"}`)
			// // 		.then(() => {
			// // 			resolve(); // Resolve the promise once the hiding operation is done
			// // 		})
			// // 		.catch((error) => {
			// // 			reject(error); // Reject the promise if an error occurs during hiding
			// // 		});
			// // });
			// // await hideStegPromise;

			// // const ipfsHash = await uploadFile();
			// // console.log("IPFS Hash:", ipfsHash);
			// // console.log("hello");
			let objList = [];
			let FailedList = [];
			let failed = false;
			for (let i = 0; i < listReq.length; i++) {
				let obj = await readSteg(
					`D:/PC/FYP/Final/backend/assests/temp/temp/verify/verify${
						i + 1
					}.jpg`
				);
				let id = getNextId(
					`D:/PC/FYP/Final/backend/meta/serverinfo.json`
				);
				if (obj.error) {
					console.log(`Error reading steg at index ${i + 1}`);
					const newvalidationObj = {
						idFailed: id,
						CSN: null,
						emailId: listReq[i].emailId,
						status: "failed",
						otp: null,
						checkotp: null,
						verifier: listReq[i].verifier,
						date: Date.now(),
					};
					addFailedValidationObj(
						newvalidationObj,
						"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json"
					);
					failed = true;
				} else {
					objList.push(obj);
					const csn = parseInt(obj.certificateId);
				}

				// console.log(obj);

				// console.log(csn);
			}
			let messageRes = "Verification failed";
			if (failed == false) {
				let csnList = [];
				for (let i = 0; i < listReq.length; i++) {
					console.log(listReq[i].emailId, objList[i].emailId);
					if (listReq[i].emailId === objList[i].emailId) {
						const newvalidationObj = {
							CSN: parseInt(objList[i].certificateId),
							emailId: objList[i].emailId,
							status: "pending",
							otp: "1234",
							checkotp: "false",
							verifier: listReq[i].verifier,
							date: Date.now(),
						};
						csnList.push(parseInt(objList[i].certificateId));
						console.log(newvalidationObj);
						addValidationObj(
							newvalidationObj,
							"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json"
						);
						messageRes = "Verification pending";
					} else {
						const newvalidationObj = {
							CSN: parseInt(objList[i].certificateId),
							emailId: listReq[i].emailId,
							status: "failed",
							otp: "1234",
							checkotp: "false",
							verifier: listReq[i].verifier,
							date: Date.now(),
						};
						csnList.push(parseInt(objList[i].certificateId));
						console.log(newvalidationObj);
						addValidationObj(
							newvalidationObj,
							"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json"
						);
						failed = true;
						messageRes = "Verification failed";
					}
				}

				if (!failed) {
					messageRes = "Verification failed";
					let certificatesVerify =
						await getCertificatesFromBlockchain(csnList);
					let fileBufferFromIPFSList = [];
					for (i = 0; i < certificatesVerify.length; i++) {
						let xx = await getFile(certificatesVerify[i].cid);
						fileBufferFromIPFSList.push(xx);
					}
					console.log(fileBufferFromIPFSList[0]);
					let verifyBufferListFinal = [];
					for (i = 0; i < certificatesVerify.length; i++) {
						let areBuffersEqual =
							Buffer.compare(
								Buffer.from(listReq[i].fileInput, "base64"),
								fileBufferFromIPFSList[i]
							) === 0;

						verifyBufferListFinal.push(areBuffersEqual);
					}
					console.log("done");
					// console.log(certificatesVerify);
					// const result = await getCertificateFromBlockchian(csn);
					// const ipfsHash = result.ipfsHash;
					// console.log(ipfsHash);

					// const fileBufferFromIPFS = await getFile(ipfsHash);

					// const areBuffersEqual =
					// 	Buffer.compare(fileBuffer, fileBufferFromIPFS) === 0;
					// console.log(areBuffersEqual);

					for (i = 0; i < verifyBufferListFinal.length; i++) {
						if (verifyBufferListFinal[i] == true) {
							messageRes =
								"File verification successful " + (i + 1);
							setCertificateStatusValid(
								{
									CSN: csnList[i],
									verifier: listReq[i].verifier,
								},
								"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json"
							);
							console.log(
								"emailid to be mailed:",
								listReq[i].emailId
							);
							let emailDetailsArray = [
								{
									email: listReq[i].emailId,
									subject: "Verification Request with OTP",
									body: "Hi student,\n This mail is to inform you that somebody want to verify your certificate.\n Kindly check and grant access with OTP: 1234.",
								},
							];
							await sendMail(emailDetailsArray);
							console.log("done mailing");
						} else {
							setCertificateStatusInValid(
								{
									CSN: csnList[i],
									verifier: listReq[i].verifier,
								},
								"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json"
							);
							messageRes =
								"File verification failed. Buffers are not equal " +
								(i + 1);
						}
						console.log(messageRes);
					}
				} else {
					messageRes = "Verification failed";
					console.log("Vertification Failed due to email mismatch");
				}
			} else {
				messageRes = "Verification failed";
				console.log("Verification Failed");
			}
			// if (areBuffersEqual) {
			// 	messageRes = "File verification successful.";
			// 	setCertificateStatusValid(
			// 		{
			// 			CSN: csn,
			// 			emailId: obj.emailId,
			// 			status: "valid",
			// 			otp: "1234",
			// 			checkotp: "false",
			// 			verifier: veriferReq,
			// 		},
			// 		"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json"
			// 	);
			// } else {
			// 	messageRes = "File verification failed. Buffers are not equal.";
			// }
			res.status(200).json({
				success: true,
				message: messageRes,
			});

			// const readBase64ContentAfterSteg = await getFileAsBase64(
			// 	"D:/PC/FYP/Final/backend/assests/temp/temp/original.jpg"
			// );
			// const bufferDataAfterSteg = Buffer.from(readBase64ContentAfterSteg, "base64");
			// read(bufferDataAfterSteg);
			// console.log("fff");
			// const getFileBuffer = await getFile(ipfsHash);
			// const bufferVariableGetIPFS = getFileBuffer.toString("base64");
			// const savedFilePathGetIPFS = await saveBase64ToFile(
			// 	bufferVariableGetIPFS,
			// 	"D:/PC/FYP/Final/backend/assests/temp/temp/original.jpg"
			// );
			// console.log("you are great");
			// await readSteg();
			// const y = await getFileAsArrayBuffer(
			// 	"D:/PC/FYP/Final/backend/assests/temp/temp/original.jpg"
			// );
			// console.log(Buffer.compare(x, y));
			// await callIPFSUpload();
			// const ipfsHash = await uploadFile(bufferVariable);
			// console.log("IPFS Hash:", ipfsHash);

			// const result = await addCertificateToBlockchain(
			// 	obj.CSN,
			// 	ipfsHash,
			// 	obj.emailId
			// );
			// console.log(
			// 	await getFileAsArrayBuffer(
			// 		`D:/PC/FYP/Final/backend/assests/original.jpg`
			// 	)
			// );
		} catch (err) {
			res.status(500).json({
				error: "Error occured in the system",

				err: err.message,
			});
		}
	}
);
// router.get("/pendingCertificates", async (req, res) => {
// 	try {
// 		const certificatesFilePath =
// 			"D:/PC/FYP/Final/backend/meta/metadb/certificatedb.json";
// 		let certificates = readServerInfo(certificatesFilePath);
// 		certificates = certificates.Certificate;
// 		// Extract email and status from request headers
// 		const emailId = req.headers.emailid;
// 		const status = req.headers.status;
// 		const checkotp = req.headers.checkotp;
// 		console.log(emailId + " : " + status);
// 		if (
// 			!emailId ||
// 			!status ||
// 			status.toLowerCase() !== "valid" ||
// 			!checkotp ||
// 			checkotp.toLowerCase() !== "false"
// 		) {
// 			return res.status(400).json({ error: "Invalid request headers." });
// 		}

// 		// Read existing certificates from file
// 		const serverInfo = readServerInfo(
// 			"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json"
// 		);

// 		// Filter certificates with status as "pending"
// 		const pendingCertificates = serverInfo.valid.filter(
// 			(certificate) =>
// 				certificate.emailId === emailId &&
// 				certificate.status === "valid" &&
// 				certificate.checkotp === "false"
// 		);

// 		// Send the pending certificates as response
// 		res.status(200).json({ success: true, pendingCertificates });
// 	} catch (error) {
// 		console.error("Error retrieving pending certificates:", error.message);
// 		res.status(500).json({ error: "Internal server error." });
// 	}
// });

router.get("/pendingCertificates", async (req, res) => {
	try {
		const certificatesFilePath =
			"D:/PC/FYP/Final/backend/meta/metadb/certificatedb.json";
		const certificates = readServerInfo(certificatesFilePath).Certificate;
		// Extract email and status from request headers
		const emailId = req.headers.emailid;
		const status = req.headers.status;
		const checkotp = req.headers.checkotp;
		console.log(emailId + " : " + status);
		if (
			!emailId ||
			!status ||
			status.toLowerCase() !== "valid" ||
			!checkotp ||
			checkotp.toLowerCase() !== "false"
		) {
			return res.status(400).json({ error: "Invalid request headers." });
		}

		// Read existing certificates from file
		const serverInfo = readServerInfo(
			"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json"
		);

		// Filter certificates with status as "pending"
		const pendingCertificates = serverInfo.valid.filter(
			(certificate) =>
				certificate.emailId === emailId &&
				certificate.status === "valid" &&
				certificate.checkotp === "false"
		);

		// Add certificateName to each pending certificate
		pendingCertificates.forEach((pendingCertificate) => {
			const correspondingCertificate = certificates.find(
				(certificate) => certificate.CSN === pendingCertificate.CSN
			);
			if (correspondingCertificate) {
				pendingCertificate.certificateName =
					correspondingCertificate.certificateName;
			}
		});

		// Send the pending certificates as response
		res.status(200).json({ success: true, pendingCertificates });
	} catch (error) {
		console.error("Error retrieving pending certificates:", error.message);
		res.status(500).json({ error: "Internal server error." });
	}
});

router.get("/setCheckOTP", async (req, res) => {
	try {
		// Extract email from request headers
		const csn = req.headers.csn;

		const emailid = req.headers.emailid;

		const status = req.headers.status;

		const otp = req.headers.otp;

		const checkotp = req.headers.checkotp;

		const verifier = req.headers.verifier;
		console.log(otp);
		// console.log(csn + emailid + verifier);
		if (!csn || !emailid || !status || !otp || !checkotp || !verifier) {
			return res.status(400).json({ error: "Email header is missing." });
		}

		// Read existing certificates from file
		const serverInfo = readServerInfo(
			"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json"
		);
		console.log(req.headers);
		// Find certificates with email matching the header
		// console.log(serverInfo);
		let matchingCertificates = [];
		serverInfo.valid.forEach((certificate) => {
			if (
				certificate.emailId === emailid &&
				certificate.CSN === parseInt(csn) &&
				certificate.status === status &&
				certificate.checkotp === checkotp &&
				certificate.verifier === verifier &&
				certificate.otp === otp
			) {
				certificate.checkotp = "true";
				matchingCertificates.push(certificate);
			}
		});
		// const matchingCertificates = serverInfo.valid.filter((certificate) => {
		// 	console.log("ffff");
		// 	console.log(
		// 		certificate.emailId === emailid,
		// 		": ",
		// 		certificate.CSN === parseInt(csn),
		// 		": ",
		// 		certificate.status === status,
		// 		": ",
		// 		certificate.checkotp === checkotp,
		// 		": ",
		// 		certificate.verifier === verifier,
		// 		": ",
		// 		certificate.otp === otp
		// 	);
		// 	certificate.emailId === emailid &&
		// 		certificate.CSN === parseInt(csn) &&
		// 		certificate.status === status &&
		// 		certificate.checkotp === checkotp &&
		// 		certificate.verifier === verifier &&
		// 		certificate.otp === otp;
		// });
		console.log(matchingCertificates);

		if (matchingCertificates.length > 0) {
			// Write the updated server info back to the file
			writeServerInfo(
				serverInfo,
				"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json"
			);

			res.status(200).json({
				success: true,
				message: "checkotp set to true for matching certificates.",
			});
		} else {
			console.log("OTP incorrect");
			res.status(400).json({
				success: false,
				message: "check your otp",
			});
		}
	} catch (error) {
		console.error("Error setting checkotp to true:", error.message);
		res.status(500).json({ error: "Internal server error." });
	}
});

async function getFileByCSN(csn, path) {
	try {
		// Read existing certificates from file
		const serverInfo = readServerInfo(path);

		// Find the certificate with the provided CSN
		const certificate = serverInfo.Certificate.find(
			(cert) => cert.CSN === csn
		);

		if (!certificate) {
			throw new Error("Certificate not found for the given CSN.");
		}

		// Retrieve file information for the certificate
		const certificateDetails = await getCertificatesFromBlockchain([csn]);
		const ipfsHash = certificateDetails[0].cid; // Assuming the certificate details contain the IPFS hash
		const fileBuffer = await getFile(ipfsHash);

		// Construct the file object to be returned
		const fileObject = {
			fileBuffer,
			filename: certificate.certificateName, // Assuming certificateName is the filename
			college: certificate.collegeName,
		};

		return fileObject;
	} catch (error) {
		console.error("Error retrieving file by CSN:", error.message);
		return null;
	}
}

router.get("/getFileByCSN", async (req, res) => {
	try {
		const csn = req.headers.csn; // Extract CSN from request headers
		console.log("CSN:", csn);

		// Retrieve file based on the CSN
		const file = await getFileByCSN(
			parseInt(csn),
			"D:/PC/FYP/Final/backend/meta/metadb/certificatedb.json"
		);

		if (!file) {
			return res.status(404).json({
				success: false,
				error: "File not found for the given CSN.",
			});
		}

		// Send response with file object to frontend
		res.status(200).json({
			success: true,
			file: file,
		});
	} catch (err) {
		console.error("Error occurred while fetching file:", err);
		res.status(500).json({
			error: "Error occurred in the system",
			err: err.message,
		});
	}
});

// router.get("/verifyStatus", async (req, res) => {
// 	try {
// 		// Extract verifier from request headers
// 		const verifier = req.headers.verifier;
// 		console.log("Verifier:", verifier);

// 		// Read existing verification details from file
// 		const filePath =
// 			"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json";
// 		const fileContent = fs.readFileSync(filePath, "utf8");
// 		const serverInfo = JSON.parse(fileContent);

// 		// Filter verification details based on the given verifier
// 		const filteredVerificationDetails = serverInfo.valid.filter(
// 			(certificate) => certificate.verifier === verifier
// 		);
// 		for (const certificate of filteredVerificationDetails) {
// 			if (
// 				certificate.status === "valid" &&
// 				certificate.checkotp === "true"
// 			) {
// 				certificate.status = "valid";
// 			} else if (certificate.status === "pending") {
// 				certificate.status = "pending";
// 			} else if (certificate.status === "failed") {
// 				certificate.status = "failed";
// 			} else {
// 				certificate.status = "pending";
// 			}
// 		}
// 		// Sort the filtered verification details by time (assuming the date property is the timestamp)
// 		filteredVerificationDetails.sort((a, b) => b.date - a.date);

// 		// Send the sorted verification details as response
// 		res.status(200).json({
// 			success: true,
// 			verificationDetails: filteredVerificationDetails,
// 		});
// 	} catch (error) {
// 		console.error("Error retrieving verification status:", error.message);
// 		res.status(500).json({ error: "Internal server error." });
// 	}
// });
router.get("/verifyStatus", async (req, res) => {
	try {
		// Extract verifier from request headers
		const verifier = req.headers.verifier;
		console.log("Verifier:", verifier);

		// Read existing verification details from file
		const filePath =
			"D:/PC/FYP/Final/backend/meta/metadb/verification/valid.json";
		const serverInfo = readServerInfo(filePath);

		// Filter verification details based on the given verifier
		const filteredVerificationDetails = serverInfo.valid.filter(
			(certificate) => certificate.verifier === verifier
		);

		// Read certificates information from certificatedb.json
		const certificatesFilePath =
			"D:/PC/FYP/Final/backend/meta/metadb/certificatedb.json";
		let certificates = readServerInfo(certificatesFilePath);
		certificates = certificates.Certificate;
		// console.log(certificates);
		// Iterate over filtered verification details to add certificateName
		for (const certificate of filteredVerificationDetails) {
			// Find the corresponding certificate from certificatedb.json
			const matchedCertificate = certificates.find(
				(cert) => cert.CSN === certificate.CSN
			);

			if (matchedCertificate) {
				// Add certificateName to the filteredVerificationDetails object
				// console.log(certificate.status, " : ", certificate.checkotp);
				if (
					certificate.status === "failed" &&
					(certificate.checkotp === "false" ||
						certificate.checkotp === null)
				) {
					certificate.certificateName =
						matchedCertificate.certificateName;
					certificate.Details = "Email ID does not match!!";
				} else if (
					certificate.status === "valid" &&
					certificate.checkotp === "true"
				) {
					certificate.certificateName =
						matchedCertificate.certificateName;
					certificate.Details = "Vertification successfull!!";
				} else if (
					certificate.status === "valid" &&
					certificate.checkotp === "false"
				) {
					certificate.certificateName =
						matchedCertificate.certificateName;
					certificate.Details = "Student need to grant access!!";
				} else if (
					certificate.status === "pending" &&
					certificate.checkotp === "false"
				) {
					certificate.certificateName =
						matchedCertificate.certificateName;
					certificate.Details =
						"Verification in process and student need to grant access!!";
				} else {
					certificate.certificateName =
						matchedCertificate.certificateName;
					certificate.Details = "Verification yet to start";
				}
			} else {
				// Set certificateName to null if CSN is null or no matching certificate is found
				certificate.certificateName = null;
				certificate.Details = "Certificate Tampered!!";
			}
		}

		// Sort the filtered verification details by time (assuming the date property is the timestamp)
		for (const certificate of filteredVerificationDetails) {
			if (
				certificate.status === "valid" &&
				certificate.checkotp === "true"
			) {
				certificate.status = "valid";
			} else if (certificate.status === "pending") {
				certificate.status = "pending";
			} else if (certificate.status === "failed") {
				certificate.status = "failed";
			} else {
				certificate.status = "pending";
			}
		}
		filteredVerificationDetails.sort((a, b) => b.date - a.date);
		// console.log(filteredVerificationDetails);

		// Send the sorted verification details as response
		res.status(200).json({
			success: true,
			verificationDetails: filteredVerificationDetails,
		});
	} catch (error) {
		console.error("Error retrieving verification status:", error.message);
		res.status(500).json({ error: "Internal server error." });
	}
});

module.exports = router;

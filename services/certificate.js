const { Web3 } = require("web3");
const CertificateRegistryContract = require("D:/PC/FYP/Final/backend/abi/CertificateRegistryV2.json");
const web3 = new Web3("http://127.0.0.1:8501");

const CONTRACT_ADDRESS = "0x2c702C95E2063445509673255f4Cf19EC53fe51B";
const PRIVATE_KEY =
	"0xf973e2f698f4abb1b7d9d414c815d784a694ac1fd705112143c969f153238463";

const contract = new web3.eth.Contract(
	CertificateRegistryContract.abi,
	CONTRACT_ADDRESS
);
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
console.log(account.address);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

async function addCertificatesToBlockchain(certificates) {
	try {
		const transaction = contract.methods.addCertificates(certificates);
		const gasEstimate = await transaction.estimateGas({
			from: account.address,
		});
		const gasPrice = await web3.eth.getGasPrice();
		const options = {
			from: account.address,
			gas: gasEstimate,
			gasPrice: gasPrice,
		};

		const receipt = await transaction.send(options);
		console.log("Transaction Hash:", receipt.transactionHash);
		console.log("Certificates added successfully!");
		return true;
	} catch (error) {
		console.error("Transaction Error:", error);
		return false;
	}
}

async function getCertificatesFromBlockchain(csnList) {
	try {
		const result = await contract.methods
			.getBufferForCSNs(csnList)
			.call({ from: account.address });

		const certificates = result.map((buffer) => {
			return {
				csn: parseInt(buffer.csn),
				cid: buffer.cid,
				emailId: buffer.emailId,
			};
		});

		console.log("Certificates Details:", certificates);
		return certificates;
	} catch (error) {
		console.error("Error:", error);
		return [];
	}
}

module.exports = { addCertificatesToBlockchain, getCertificatesFromBlockchain };

// module.exports = { addCertificatesToBlockchain, getCertificatesFromBlockchain };

// Example usage:
// addCertificateToBlockchain(2, "cidvalue", "laxman@gmail.com");
// getCertificateFromBlockchian(17);
// Example usage:
// async function exampleUsage() {
//     // Add certificates
//     await addCertificatesToBlockchain([
// 		{ csn: 9000, cid: "cidvalue1", emailId: "laxman1@gmail.com" },
// 		{ csn: 9001, cid: "cidvalue2", emailId: "laxman2@gmail.com" },
// 		{ csn: 9002, cid: "cidvalue3", emailId: "laxman3@gmail.com" },
// 	]);

//     // Retrieve certificates
//     await getCertificatesFromBlockchain([9000, 9001, 9002]);
// }
// exampleUsage();

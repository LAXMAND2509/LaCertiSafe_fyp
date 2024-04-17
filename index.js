// server.js
const util = require("util");
const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const { certificateAddPost } = require("../backend/routes/certificates");
var cors = require("cors");
const app = express();
const port = 4000;
app.use(cors());
app.use(express.json()); // to use the response body
app.use(express.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(fileUpload());
// Set up home route
app.get("/", (req, res) => {
	res.send("This is the homepage");
});
// Set up second page
app.get("/second", (req, res) => {
	res.send("This is the second page");
});

app.use("/api/certificate", require("./routes/certificates"));

app.listen(port, () => {
	console.log(`Success! Your application is running on port ${port}.`);
});


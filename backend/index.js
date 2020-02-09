// index.js

/**
 * Required External Modules
 */
const express = require("express");
const path = require("path");
const bodyParser = require('body-parser');
/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || "9000";
const db = require("./models");
const {APIroutes,APImiddlewares} = require("./API/index");

/**
 *  App Configuration
 */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Initialize middlewares and APIs
/*
Object.keys(APImiddlewares).forEach(middle => {
    app.use(APImiddlewares[middle]);
});*/
Object.keys(APIroutes).forEach(route => {
    APIroutes[route](app,db);
});

/**
 * Server Activation
 */
app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});

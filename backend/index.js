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
const fs = require('fs');
const publicKey = fs.readFileSync(__dirname+'/crypto/sde.key.pub');
/**
 *  App Configuration
 */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((error, request, response, next) => {
    if (error !== null) {
        return response.status(400).json({ 'invalid': 'json' });
    }
    return next();
});
// Set content type GLOBALLY for any response.
app.use(function (req, res, next) {
  res.contentType('application/json');
  res.set("Access-Control-Allow-Origin", "*");
  next();
});


// Initialize middlewares and APIs
/*
Object.keys(APImiddlewares).forEach(middle => {
    app.use(APImiddlewares[middle]);
});*/
Object.keys(APIroutes).forEach(route => {
    APIroutes[route](app,db);
});
app.get("/publicKey",(req,res)=>{
    res.send(publicKey);
});
/**
 * Server Activation
 */
app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});

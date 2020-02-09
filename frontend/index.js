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
const port = process.env.PORT || "8000";

/**
 *  App Configuration
 */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**
 * Routes Definitions
 */
const signup = require("./routes/signup");
signup(app);
app.get("/", (req, res) => {
	res.render("index",{title:"Home"});
});

/**
 * Server Activation
 */
app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});

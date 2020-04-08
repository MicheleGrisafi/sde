// index.js

/**
 * Required External Modules
 */
const express = require("express");
const session = require('express-session');
const path = require("path");
const bodyParser = require('body-parser');
const config = require("./config/config.json")
/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || config.development.port;

/**
 *  App Configuration
 */
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({secret: 'ssshhhhh'}));

/**
 * Routes Definitions
 */
const signup = require("./routes/signup");
const login = require("./routes/login");
const connectAccount=require("./routes/linkAccount");
const controlPanel=require("./routes/controlPanel");
const manageNotes=require("./routes/manageNotes");
signup(app);
login(app);
connectAccount(app);
controlPanel(app);
manageNotes(app);
app.get("/", (req, res) => {
	res.render("index",{email:req.session.email});
});

/**
 * Server Activation
 */
app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});

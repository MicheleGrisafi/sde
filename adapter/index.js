// index.js

/**
 * Required External Modules
 */
const express = require("express");
const bodyParser = require('body-parser');
const config = require("./config/config.json")
const util = require("util");
const cheerio = require('cheerio');


/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || config.development.port;

/**
 *  App Configuration
 */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


function onenoteToGeneral(onenoteNote){

    onenoteNote = new Buffer(onenoteNote, 'base64').toString('ascii');
    var $ = cheerio.load(onenoteNote);
    /*$("div").each(function(i,element){
        if($(this).html()=="<br>"){
            console.log("Found one\n");
            $(this).replaceWith("<br/>");
        }else if($(this).html()==""){
            $(this).remove();
        }
    });
    $("en-media").remove();*/
    
    return new Buffer($.html()).toString('base64');
}
function evernoteToGeneral(evernoteNote){
    evernoteNote = new Buffer(evernoteNote, 'base64').toString('ascii');
    var $ = cheerio.load(evernoteNote);
    $("div").each(function(i,element){
        if($(this).html()=="<br>"){
            $(this).replaceWith("<br/>");
        }else if($(this).html()==""){
            $(this).remove();
        }
    });
    $("en-media").remove();
    return new Buffer($.html()).toString('base64');
}

/* Endpoints */
app.get("/", (req, res) => {
	res.send("Adapter Endpoint");
});

app.get("/adapter/onenote/list",(req,res)=>{
	let data = JSON.parse(decodeURI(req.query.list));
	console.log(data.value);
	if(data==null){
		res.status(400).send('{"error":"The request is malformed"}');
		return;
	}
	noteList = [];
	data.value.forEach(function(note) {
		var title = note.title;
		var id = note.id;
		console.log("Title: "+title+"; Id: "+id+"\n\n");
		note = {
			title:title,
			id:id
		}
		noteList.push(note);
	});
	noteList = JSON.stringify(noteList)
	console.log(noteList);
	res.status(200).send(noteList);

});
app.get("/adapter/onenote/note",(req,res)=>{
	let content = decodeURIComponent(req.query.content);
	let metadata= decodeURIComponent(req.query.metadata);
	
	if(metadata == null || content== null){
		res.status(400).send('{"error":"The request is malformed"}');
		return;
	}

	//Collect metadata
	metadata = JSON.parse(metadata);
	let title = metadata.title;
	let lastUpdated = metadata.lastModifiedDateTime;
	let id = metadata.id;
	//Convert data to timestamp
	const middle = /[a-z]/i;
	const last = /[a-z]/ig;
	lastUpdated = lastUpdated.replace(middle,' ');
	lastUpdated = lastUpdated.replace(last,'');
	var timestampMilli = Date.parse(lastUpdated);
	lastUpdated = Math.round(timestampMilli/1000);

	note = {
		id:id,
		title: title,
		content: onenoteToGeneral(content),
		lastUpdated: lastUpdated
	}

	
	note = JSON.stringify(note)
	console.log(note);
	res.status(200).send(note);

});

app.get("/adapter/evernote/list",(req,res)=>{
	console.log(decodeURI(req.query.list));
	let data = JSON.parse(decodeURI(req.query.list));
	console.log(data);
	if(data==null){
		res.status(400).send('{"error":"The request is malformed"}');
		return;
	}
	noteList = [];
	data.forEach(function(note) {
		var title = note.title;
		var id = note.id;
		console.log("Title: "+title+"; Id: "+id+"\n\n");
		note = {
			title:title,
			id:id
		}
		noteList.push(note);
	});
	noteList = JSON.stringify(noteList)
	console.log(noteList);
	res.status(200).send(noteList);

});
app.get("/adapter/evernote/note",(req,res)=>{
	let content = decodeURIComponent(req.query.content);
	let title= decodeURIComponent(req.query.title);
	let id= decodeURIComponent(req.query.id);
	let lastUpdated= decodeURIComponent(req.query.lastUpdated);
	
	if(title == null || content== null || id == null || lastUpdated == null){
		res.status(400).send('{"error":"The request is malformed"}');
		return;
	}


	let note = {
		id:id,
		title: title,
		content: evernoteToGeneral(content),
		lastUpdated: lastUpdated
	}

	
	note = JSON.stringify(note)
	console.log(note);
	res.status(200).send(note);

});


/**
 * Server Activation
 */
app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});

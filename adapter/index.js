// index.js

/**
 * Required External Modules
 */
const express = require("express");
const bodyParser = require('body-parser');
const config = require("./config/config.json")
const util = require("util");
//const xml = require("xml-parse");
var parser = require('fast-xml-parser');
const he = require("he");
/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || config.development.port;
const everDoctype = "<!DOCTYPE en-note SYSTEM 'http://xml.evernote.com/pub/enml2.dtd'>";

/**
 *  App Configuration
 */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const options1 = {
    /*attributeNamePrefix : "@_",
    attrNodeName: "attr", //default is 'false'
    textNodeName : "#text",*/
    ignoreAttributes : false,
    ignoreNameSpace : false,
    allowBooleanAttributes : true,
    trimValues: true,
    cdataTagName: "__cdata", //default is 'false'
    cdataPositionChar: "\\c",
    parseTrueNumberOnly: false,
    arrayMode: false, /*
    attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),//default is a=>a
    tagValueProcessor : (val, tagName) => he.decode(val), //default is a=>a
    stopNodes: ["parse-me-as-string"]*/
};
var options2 = {
	/*attributeNamePrefix : "@_",
	attrNodeName: "@", //default is false
	textNodeName : "#text",*/
	ignoreAttributes : false,
	cdataTagName: "__cdata", //default is false
	cdataPositionChar: "\\c",
	format: false,
	indentBy: "  ",
	supressEmptyNode: false/*,
	tagValueProcessor: a=> he.encode(a, { useNamedReferences: true}),// default is a=>a
    attrValueProcessor: a=> he.encode(a, {isAttributeValue: isAttribute, useNamedReferences: true})// default is a=>a
*/};

function onenoteToGeneral(onenoteNote){
    onenoteNote = new Buffer(onenoteNote, 'base64').toString('ascii');
    var jsonObj = parser.parse(onenoteNote,options1);
	console.log("Original JSON: " + JSON.stringify(jsonObj));
	body = jsonObj.html.body;
	console.log("Body onlu:" + JSON.stringify(body));
	var Parser = require("fast-xml-parser").j2xParser;
	var parser2 = new Parser(options2);
	var xml = parser2.parse(body);
	xml = "<notesync-note>"+removeXMLInvalidChars(xml)+"</notesync-note>";
	//console.log("New general:  " + xml);
	return new Buffer(xml).toString('base64');
}
function generalToOnenote(generalNote,title){
	generalNote = new Buffer(generalNote, 'base64').toString('ascii');
	generalNote = generalNote.substr(15,generalNote.length - 1); //remove notesync tag
	generalNote = generalNote.substr(0,generalNote.indexOf("</notesync-note>"));
	
	//var jsonObj = parser.parse(generalNote,options1);
	//console.log("REceived note:" + generalNote + "\n Converted in " + util.inspect(jsonObj));
	
	//var string = JSON.stringify(jsonObj);
	//string = string.substr(0,string.indexOf("body")-1) + '"head":{"title":"'+title+'"},' + string.substr(string.indexOf("body")-1,string.length-1);
	//{"title":title,"meta":[{"@_http-equiv":"Content-Type","@_content":"text/html; charset=utf-8"},{"@_name":"created","@_content":"2016-09-20T15:15:00.0000000"}]}
	//console.log("JSON: " + string);
	//console.log("JSON to parse:" + string);
	//var Parser = require("fast-xml-parser").j2xParser;
	//var parser2 = new Parser(options2);
	//var xml = parser2.parse(JSON.parse(string));
	xml = "<html><head><title>"+title+"</title></head><body>"+removeXMLInvalidChars(generalNote)+"</body></html>";
	//console.log("Parsed back: " + xml);
	

    return new Buffer(xml).toString('base64');
}



/**
 * Removes XML-invalid characters from a string.
 * @param {string} string - a string potentially containing XML-invalid characters, such as non-UTF8 characters, STX, EOX and so on.
 * @param {boolean} removeDiscouragedChars - a string potentially containing XML-invalid characters, such as non-UTF8 characters, STX, EOX and so on.
 * @return : a sanitized string without all the XML-invalid characters.
 */
function removeXMLInvalidChars(string, removeDiscouragedChars = true){
    // remove everything forbidden by XML 1.0 specifications, plus the unicode replacement character U+FFFD
    var regex = /((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/g;
    string = string.replace(regex, "");

    if (removeDiscouragedChars) {
        // remove everything not suggested by XML 1.0 specifications
        regex = new RegExp(
            "([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|(?:\\uD83F[\\uDFFE\\uDFFF])|(?:\\uD87F[\\uDF"+
            "FE\\uDFFF])|(?:\\uD8BF[\\uDFFE\\uDFFF])|(?:\\uD8FF[\\uDFFE\\uDFFF])|(?:\\uD93F[\\uDFFE\\uD"+
            "FFF])|(?:\\uD97F[\\uDFFE\\uDFFF])|(?:\\uD9BF[\\uDFFE\\uDFFF])|(?:\\uD9FF[\\uDFFE\\uDFFF])"+
            "|(?:\\uDA3F[\\uDFFE\\uDFFF])|(?:\\uDA7F[\\uDFFE\\uDFFF])|(?:\\uDABF[\\uDFFE\\uDFFF])|(?:\\"+
            "uDAFF[\\uDFFE\\uDFFF])|(?:\\uDB3F[\\uDFFE\\uDFFF])|(?:\\uDB7F[\\uDFFE\\uDFFF])|(?:\\uDBBF"+
            "[\\uDFFE\\uDFFF])|(?:\\uDBFF[\\uDFFE\\uDFFF])(?:[\\0-\\t\\x0B\\f\\x0E-\\u2027\\u202A-\\uD7FF\\"+
            "uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|"+
            "(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))", "g");
        string = string.replace(regex, "");
    }
    return string;
}
function evernoteToGeneral(evernoteNote){
	evernoteNote = new Buffer(evernoteNote, 'base64').toString('ascii');
	console.log("Old non loaded: " + evernoteNote);
	
	/*var jsonObj = parser.parse(evernoteNote,options1);
	console.log("JSON: " + JSON.stringify(jsonObj));
	
	
	var Parser = require("fast-xml-parser").j2xParser;
	var parser2 = new Parser(options2);
	var xml = parser2.parse(jsonObj);
	xml = removeXMLInvalidChars(xml);*/
	let stripped = evernoteNote.substring(evernoteNote.indexOf("<en-note>")+"<en-note>".length,evernoteNote.length);
	//console.log("Semi update:" + stripped);
	stripped = stripped.substr(0,stripped.indexOf("</en-note>"));
	//console.log("Semi update:" + stripped);
	evernoteNote = "<notesync-note>" + stripped + "</notesync-note>";
	//console.log("New note:" + evernoteNote);
    return new Buffer(evernoteNote).toString('base64');
}
function generalToEvernote(generalNote){
	generalNote = new Buffer(generalNote, 'base64').toString('ascii');
	generalNote = generalNote.substr(15,generalNote.length - 1); //remove notesync tag
	generalNote = generalNote.substr(0,generalNote.indexOf("</notesync-note>"));
	console.log("Non converted: " + generalNote);
	
	/*var jsonObj = parser.parse(generalNote,options1);
	console.log("JSON: " + JSON.stringify(jsonObj));
	
	var Parser = require("fast-xml-parser").j2xParser;
	var parser2 = new Parser(options2);
	var xml = parser2.parse(jsonObj);*/
	let xml = '<?xml version="1.0" encoding="UTF-8"?>' 
	+ everDoctype + "<en-note>"  
	+ removeXMLInvalidChars(generalNote) 
	+ "</en-note>";
	return new Buffer(xml).toString('base64');
}

/* Endpoints */
app.get("/", (req, res) => {
	res.send("Adapter Endpoint");
});

app.get("/adapter/onenote/list",(req,res)=>{
	let data;
	if (req.query.list != null){
		//console.log("Incoming data:" + req.query.list)
		data = JSON.parse(decodeURI(req.query.list));
	}else{
		//console.log("Incoming data:" + util.inspect(req.body));
		data = req.body;
	}
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
app.get("/adapter/onenote/toGeneral",(req,res)=>{
	console.log("Request conversion of note");
	
	let content = req.body.content;
	let metadata= req.body.metadata;
	
	if(metadata == null || content== null || content== "" || metadata == ""){
		content = decodeURIComponent(req.query.content);
		metadata= decodeURIComponent(req.query.metadata);
		console.log("Use query param request");
		if(metadata == null || content== null){
			res.status(400).send('{"error":"The request is malformed"}');
			return;
		}
	}else{
		console.log("Using body parameters: " + metadata + " - " + content);
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
	//console.log(note);
	res.status(200).send(note);

});

//TODO: implement it
app.get("/adapter/onenote/toOnenote",(req,res)=>{
	console.log("Onenote note has been requested");
	let content = decodeURIComponent(req.query.content);
	let title= decodeURIComponent(req.query.title);
	let id= decodeURIComponent(req.query.id);
	let lastUpdated= decodeURIComponent(req.query.lastUpdated);
	
	let data = req.body;
	console.log("Body " +util.inspect(req.body));
	console.log("Url parameters: " +title + id+ lastUpdated);
	if (data != null){
		content = data.content;
		title = data.title;
		id = data.id;
		lastUpdated = data.lastUpdated
		console.log("DATA parameters: " +title + id+ lastUpdated);
	}
	if(title == null && content== null && id == null && lastUpdated == null){
		res.status(400).send('{"error":"The request is malformed"}');
		return;
	}
	content = generalToOnenote(content,title);
	let note = {
		id:id,
		title: title,
		content: content,
		lastUpdated: lastUpdated
	}
	note = JSON.stringify(note);
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
app.get("/adapter/evernote/toGeneral",(req,res)=>{
	console.log("General note has been requested");
	
	let content = decodeURIComponent(req.query.content);
	let title= decodeURIComponent(req.query.title);
	let id= decodeURIComponent(req.query.id);
	let lastUpdated= decodeURIComponent(req.query.lastUpdated);
	let data = req.body;
	console.log("Body " +util.inspect(req.body));
	console.log("Ulr parameters: " +title + id+ lastUpdated);
	if (data != null){
		content = data.content;
		title = data.title;
		id = data.id;
		lastUpdated = data.lastUpdated
		console.log("DATA parameters: " +title + id+ lastUpdated);
	}
	if(title == null || content== null || id == null || lastUpdated == null){
		res.status(400).send('{"error":"The request is malformed"}');
		return;
	}
	
	let note = {
		id:id,
		title: title,
		content: evernoteToGeneral(content),
		lastUpdated: Math.round(lastUpdated/1000)
	}

	
	note = JSON.stringify(note);
	res.status(200).send(note);

});

app.get("/adapter/evernote/toEvernote",(req,res)=>{
	console.log("Evernote note has been requested");
	let content = decodeURIComponent(req.query.content);
	let title= decodeURIComponent(req.query.title);
	let id= decodeURIComponent(req.query.id);
	let lastUpdated= decodeURIComponent(req.query.lastUpdated);
	let data = req.body;
	console.log("Body " +util.inspect(req.body));
	console.log("Ulr parameters: " +title + id+ lastUpdated);
	if (data != null){
		content = data.content;
		title = data.title;
		id = data.id;
		lastUpdated = data.lastUpdated
		console.log("DATA parameters: " +title + id+ lastUpdated);
	}
	if(title == null && content== null && id == null && lastUpdated == null){
		res.status(400).send('{"error":"The request is malformed"}');
		return;
	}
	
	let note = {
		id:id,
		title: title,
		content: generalToEvernote(content),
		lastUpdated: lastUpdated
	}

	
	note = JSON.stringify(note);
	res.status(200).send(note);
});

/**
 * Server Activation
 */
app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});

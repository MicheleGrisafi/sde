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
	
	//var xmlDoc = xml.parse(evernoteNote);
	var jsonObj = parser.parse(evernoteNote,options1);
	console.log("JSON: " + JSON.stringify(jsonObj));
	
	
	var Parser = require("fast-xml-parser").j2xParser;
	var parser2 = new Parser(options2);
	var xml = parser2.parse(jsonObj);
	xml = removeXMLInvalidChars(xml);

    return new Buffer(xml).toString('base64');
}
function generalToEvernote(generalNote){
	generalNote = new Buffer(generalNote, 'base64').toString('ascii');
	console.log("Old non loaded: " + generalNote);
	
	var jsonObj = parser.parse(generalNote,options1);
	console.log("JSON: " + JSON.stringify(jsonObj));
	
	var Parser = require("fast-xml-parser").j2xParser;
	var parser2 = new Parser(options2);
	var xml = parser2.parse(jsonObj);
	xml = everDoctype + removeXMLInvalidChars(xml);
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

//TODO: implement it
app.get("/adapter/onenote/toOnenote",(req,res)=>{
	

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
	if(title == null || content== null || id == null || lastUpdated == null){
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

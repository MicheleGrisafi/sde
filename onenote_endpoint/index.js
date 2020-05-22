// index.js
/**
 * ONE NOTE ENDPOINT
 * This code handles the interaction with the OneNote external service.
 */

/**
 * Required External Modules
 */
const express = require("express");
const bodyParser = require('body-parser');
const config = require("./config/config.json")
const util = require("util");
const https = require("https");
const http = require("http");


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





/**
 * Extract the token from the Auth Header request
 * @param req node request
 * @return token if present, null otherwise
 */
function extractToken(req){
	let auth_header = req.header('Authorization');
	if(auth_header == null || auth_header.search("Bearer") < 0){
		return null;
	}
	return auth_header.substr(7,auth_header.len);
}

/* Endpoints */
app.get("/", (req, res) => {
	res.send("Onenote Endpoint");
});

app.get("/onenote/notes",(req,res)=>{
	let authCode = extractToken(req);
	if(authCode==null){
		res.send(401,'{"error":"The provided security token is not valid"}');
		return;
	}

	let options = {
		host: "graph.microsoft.com",
		path: "/v1.0/me/onenote/pages",
		headers: {
			'Authorization':'Bearer ' + authCode
		}
	}
	const request = https.request(options, incoming => {
		console.log(`statusCode: ${incoming.statusCode}`);
		let data = "";
		incoming.on('data', function (chunk) {
			data+=chunk;
		});
		incoming.on("end",()=>{
			if(incoming.statusCode == 401){
				res.status(401).send('{"error":"Token expired/invalid"}');
				return;
			}else if(incoming.statusCode != 200){
				res.send(500,'{"error":"Problem with the retrieval of the notes"}');
				console.log(data);
				return;
			}
		
			console.log("Uncoded list:"+data);
			let payload = data;
			let options = {
				host:config.adapterEndpoint.host,
				path:"/adapter/onenote/list",
				port:config.adapterEndpoint.port,
				headers:{
					'Content-Type': 'application/json',
					'Content-Length': payload.length
				}
			}
			const request = http.request(options, incoming => {
				console.log(`statusCode: ${incoming.statusCode}`);
				let data = "";
				incoming.on('data', function (chunk) {
					data += chunk;
				});
				incoming.on("end",()=>{
					console.log("NoteList:" + data);
					if (incoming.statusCode != 200){
						res.send(500,'{"error":"Problem with the retrieval of the notes"}')
					}else{
						res.send(200,data);
					}
				});
			})
			request.on('error', error => {
				console.error(error);
				res.send(500,'{"error":"Problem with the retrieval of the notes"}')
			})
			request.write(payload);
			request.end();
		});
	})
	request.on('error', error => {
		console.error(error)
		res.send(500,'{"error":"Problem with the retrieval of the notes"}')
	})
	request.end();
});
app.post("/onenote/notes",(req,res)=>{
	let authCode = extractToken(req);
	if(authCode==null){
		res.send(401,'{"error":"The provided security token is not valid"}');
		return;
	}
	let content = req.body.content;
	let title = req.body.title;
	if(title == null || content == null){
		res.status(400).send('{"error":"Malformed request"}');
		return;
	}
	payload = JSON.stringify({
		title: title,
		content: content
	});
	let options = {
		host:config.adapterEndpoint.host,
		path:"/adapter/onenote/toOnenote",
		port:config.adapterEndpoint.port,
		headers:{
			'Content-Type': 'application/json',
			'Content-Length': payload.length
		}
	}
	const request = http.request(options, incoming => {
		console.log(`statusCode: ${incoming.statusCode}`);
		let data = "";
		incoming.on('data', function (chunk) {
			data += chunk;
		});
		incoming.on("end",()=>{
			console.log("Adapted Note:" + data);
			if (incoming.statusCode != 200){
				res.send(500,'{"error":"Problem while contacting the adapter"}')
			}else{
				console.log("The note has been converted. Exporting it to Onenote");
				noteContent = new Buffer(JSON.parse(data).content, 'base64').toString('ascii');
				payload = noteContent;
				console.log("Note content to send to Onente:" + noteContent);
				let options = {
					host: "graph.microsoft.com",
					path: "/v1.0/me/onenote/pages",
					method: 'POST',
					headers: {
						'Authorization':'Bearer ' + authCode,
						'Content-Type' : 'application/xhtml+xml',
						'Content-Length': payload.length
					}
				}
				const request = https.request(options, incoming => {
					console.log(`statusCode: ${incoming.statusCode}`);
					let data = "";
					incoming.on('data', function (chunk) {
						data+=chunk;
					});
					incoming.on("end",()=>{
						console.log(data);
						if(incoming.statusCode == 401){
							res.status(401).send('{"error":"Invalid Token"}');
						}else if(incoming.statusCode != 201){
							res.send(500,'{"error":"Problem with the creation of the note on OneNote"}');
							return;
						}else{
							// convert metadata into generalNote format
							payload = JSON.stringify({
								metadata: data
							});
							console.log("Sending the following metadat to be converted: " + payload);
							options = {
								host:config.adapterEndpoint.host,
								path:"/adapter/onenote/toGeneral",
								port:config.adapterEndpoint.port,
								headers:{
									'Content-Type': 'application/json',
                                	'Content-Length': payload.length
								}
							}
							const request = http.request(options, incoming => {
								console.log(`statusCode: ${incoming.statusCode}`);
								let data = "";
								incoming.on('data', function (chunk) {
									data += chunk;
								});
								incoming.on("end",()=>{
									console.log("Note metadata converted:" + data);
									if (incoming.statusCode != 200){
										res.send(500,'{"error":"Problem with the retrieval of the note from the adapter"}')
									}else{
										// Send back the converted note
										res.status(200).send(data);
									}
								});
							})
							
							request.on('error', error => {
								console.error(error);
								res.send(500,'{"error":"Problem with the retrieval of the notes from the adapter"}');
							})
							request.write(payload);
							request.end();	
						}
					});
				})
				request.on('error', error => {
					console.error(error)
					res.send(500,'{"error":"Problem with the creation of the note on OneNote"}')
				})
				request.write(payload);
				request.end();
			}
		});
	})
	request.on('error', error => {
		console.error(error);
		res.send(500,'{"error":"Problem with contacting the adapter"}')
	})
	request.write(payload);
	request.end();




});


app.get("/onenote/notes/:id",(req,res)=>{
	let authCode = extractToken(req);
	let noteId = req.params.id;

	if(authCode==null){
		res.send(401,'{"error":"The provided security token is not valid"}');
		return;
	}

	let metadata = "";
	let content = "";
	
	
	// Fetch the metadata for the note
	let options = {
		host:"graph.microsoft.com",
		path:"/v1.0/me/onenote/pages/"+noteId,
		headers:{
			'Authorization': 'Bearer ' + authCode
		}
	}
	const request = https.request(options, incoming => {
		console.log(`statusCode: ${incoming.statusCode}`);
		let data = "";
		incoming.on('data', function (chunk) {
			data += chunk;
		});
		incoming.on("end",()=>{ 
			console.log("View metadata:" + data);
			if (incoming.statusCode == 401){
				res.status(401).send('{"error":"Token expired/invalid"}');
			}else if (incoming.statusCode != 200){
				console.log("Status is:"+incoming.statusCode+"/401");
				res.status(500).send('{"error":"Problem with the retrieval of the notes"}');
			}else if(incoming.statusCode == 200){
				metadata = data;//encodeURIComponent(data);

				//Fetch content
				//Create request to Microsoft server
				options = {
					host:"graph.microsoft.com",
					path:"/v1.0/me/onenote/pages/"+noteId+"/content",
					headers:{
						'Authorization': 'Bearer ' + authCode
					}
				}
				const request = https.request(options, incoming => {
					console.log(`statusCode: ${incoming.statusCode}`);
					let data = "";
					incoming.on('data', function (chunk) {
						data += chunk;
					});
					incoming.on("end",()=>{
						console.log("View note:" + data);
						if (incoming.statusCode != 200){
							res.send(500,'{"error":"Problem with the retrieval of the notes"}')
						}else{
							content = new Buffer(data).toString('base64');//encodeURIComponent(new Buffer(data).toString('base64'));
							// Adapt content to NoteSync standard
							payload = JSON.stringify({
								metadata: metadata,
								content: content
							});
							options = {
								host:config.adapterEndpoint.host,
								path:"/adapter/onenote/toGeneral",//?metadata="+metadata+"&content="+content,
								port:config.adapterEndpoint.port,
								headers:{
									'Content-Type': 'application/json',
                                	'Content-Length': payload.length
								}
							}
							const request = http.request(options, incoming => {
								console.log(`statusCode: ${incoming.statusCode}`);
								let data = "";
								incoming.on('data', function (chunk) {
									data += chunk;
								});
								incoming.on("end",()=>{
									console.log("Note:" + data);
									if (incoming.statusCode != 200){
										res.send(500,'{"error":"Problem with the retrieval of the notes"}')
									}else{
										// Send back the converted note
										res.send(200,data);
									}
								});
							})
							
							request.on('error', error => {
								console.error(error);
								res.send(500,'{"error":"Problem with the retrieval of the notes"}');
							})
							request.write(payload);
							request.end();
						}
					});
				})
				
				request.on('error', error => {
					console.error(error);
					res.send(500,'{"error":"Problem with the retrieval of the notes"}');
				})
				
				request.end();
			}
		});
	})
	
	request.on('error', error => {
		console.error("Error in the request: " + error);
		res.render("error",{error:"There was an error requesting the note"});
	})
	
	request.end();
});

app.put("/onenote/notes/:id",(req,res)=>{
	let authCode = extractToken(req);
	let noteId = req.params.id;

	if(authCode==null){
		res.send(401,'{"error":"The provided security token is not valid"}');
		return;
	}

	let metadata = "";
	let content = "";
	
	
	// Fetch the metadata for the note
	let options = {
		host:"graph.microsoft.com",
		path:"/v1.0/me/onenote/pages/"+noteId+"/content",
		headers:{
			'Authorization': 'Bearer ' + authCode
		}
	}
	const request = https.request(options, incoming => {
		console.log(`statusCode: ${incoming.statusCode}`);
		let data = "";
		incoming.on('data', function (chunk) {
			data += chunk;
		});
		incoming.on("end",()=>{ 
			console.log("View metadata:" + data);
			if (incoming.statusCode == 401){
				res.status(401).send('{"error":"Token expired/invalid"}');
			}else if (incoming.statusCode != 200){
				console.log("Status is:"+incoming.statusCode+"/401");
				res.status(500).send('{"error":"Problem with the retrieval of the notes"}');
			}else if(incoming.statusCode == 200){
				metadata = encodeURIComponent(data);

				//Fetch content
				//Create request to Microsoft server
				let options = {
					host:"graph.microsoft.com",
					path:"/v1.0/me/onenote/pages/"+noteId+"/content",
					headers:{
						'Authorization': 'Bearer ' + authCode
					}
				}
				const request = https.request(options, incoming => {
					console.log(`statusCode: ${incoming.statusCode}`);
					let data = "";
					incoming.on('data', function (chunk) {
						data += chunk;
					});
					incoming.on("end",()=>{
						console.log("View note:" + data);
						if (incoming.statusCode != 200){
							res.send(500,'{"error":"Problem with the retrieval of the notes"}')
						}else{
							content = encodeURIComponent(new Buffer(data).toString('base64'));
							// Adapt content to NoteSync standard
							let options = {
								host:config.adapterEndpoint.host,
								path:"/adapter/onenote/note?metadata="+metadata+"&content="+content,
								port:config.adapterEndpoint.port
							}
							const request = http.request(options, incoming => {
								console.log(`statusCode: ${incoming.statusCode}`);
								let data = "";
								incoming.on('data', function (chunk) {
									data += chunk;
								});
								incoming.on("end",()=>{
									console.log("Note:" + data);
									if (incoming.statusCode != 200){
										res.send(500,'{"error":"Problem with the retrieval of the notes"}')
									}else{
										// Send back the converted note
										res.send(200,data);
									}
								});
							})
							
							request.on('error', error => {
								console.error(error);
								res.send(500,'{"error":"Problem with the retrieval of the notes"}');
							})
							
							request.end();
						}
					});
				})
				
				request.on('error', error => {
					console.error(error);
					res.send(500,'{"error":"Problem with the retrieval of the notes"}');
				})
				
				request.end();
			}
		});
	})
	
	request.on('error', error => {
		console.error("Error in the request: " + error);
		res.render("error",{error:"There was an error requesting the note"});
	})
	
	request.end();
});

/**
 * Server Activation
 */
app.listen(port, () => {
	console.log(`Listening to requests on http://localhost:${port}`);
});

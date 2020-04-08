const isLogged = require("./../middlewares/isLogged");
const http = require("http");
const https = require("https");
const config = require("./../config/config.json");

const util = require("util");

//Adapters
function evernoteToGeneral(evernoteNote){
    newNote = ""

    return newNote;
}


module.exports = (app) => {
    app.get("/manageNotes",isLogged,(req,res)=>{
        let userNotes;
        let sharedNotes;
        
        
        let options = {
            host:config.api.host,
            path:"/API/users/" + req.session.userId + "/notes",
            port:config.api.port,
            headers:{
                'Authorization': 'Bearer ' + req.session.apiToken
            }
        }
        const request = http.request(options, incoming => {
            console.log(`statusCode: ${incoming.statusCode}`);
            let data = "";
            incoming.on('data', function (chunk) {
                data += chunk;
            });
            incoming.on("end",()=>{
                if (incoming.statusCode != 200){
                    res.render("error",{error:data.error});
                    console.log(data);
                    return;
                }
                userNotes = JSON.parse(data);
                let options = {
                    host:config.api.host,
                    path:"/API/users/" + req.session.userId + "/notes/shared",
                    port:config.api.port,
                    headers:{
                        'Authorization': 'Bearer ' + req.session.apiToken
                    }
                }
                const request = http.request(options, incoming => {
                    console.log(`statusCode: ${incoming.statusCode}`);
                    let data = "";
                    incoming.on('data', function (chunk) {
                        data += chunk;
                    });
                    incoming.on("end",()=>{
                        if (incoming.statusCode != 200){
                            res.render("error",{error:data.error});
                            console.log(data);
                            return;
                        }
                        sharedNotes = JSON.parse(data);
                        console.log("Users: \n" + userNotes + "\nShared:\n"+sharedNotes);
                        res.render("manageNotes",{notes:userNotes,shared:sharedNotes});
                    });
                })
                
                request.on('error', error => {
                    console.error(error)
                })
                
                request.end();
            });
        })
        
        request.on('error', error => {
            console.error(error)
        })
        
        request.end();
        //res.render("manageNotes",{notes:{},shared:{}});
    });

    app.post("/manageNotes/add",isLogged,(req,res)=>{
        let payload = JSON.stringify({
            title: req.body.title,
            content: req.body.content,
            ownerId: req.session.userId
        });
        console.log(payload);
        let options = {
            host:config.api.host,
            path:"/API/notes",
            port:config.api.port,
            method: "POST",
            headers:{
                'Authorization': 'Bearer ' + req.session.apiToken,
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        }

        const request = http.request(options, incoming => {
            console.log(`statusCode: ${incoming.statusCode}`);
            let data = "";
            incoming.on('data', function (chunk) {
                data+=chunk;
            });
            incoming.on("end",()=>{
                console.log(data);
                data = JSON.parse(data);
                if(incoming.statusCode != 200){
                    res.render("error",{error:data.error});
                    console.log(data);
                    return;
                }
                res.redirect("/manageNotes");
            });
        })
        request.on('error', error => {
            console.error(error)
            res.render("error",{title:"PRoblem",error:"Error in the request"});
        })
        request.write(payload);
        request.end();
        
    });
    

    //Get list of notes to display the user
    app.get("/manageNotes/add/external",isLogged,(req,res)=>{
        if(req.session.provider == null){
            console.log(req.session)
            res.redirect("/controlPanel")
        }else if(req.session.provider == 0){ //Onenote
            let options = {
                host: "graph.microsoft.com",
                path: "/v1.0/me/onenote/pages",//https://graph.microsoft.com/v1.0/me/onenote/pages
                headers: {
                    'Authorization':'Bearer ' + req.session.providerToken
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
                    data = JSON.parse(data);
                    if(incoming.statusCode != 200){
                        res.render("error",{error:"Problem with the retrieval of the notes"});
                        console.log(data);
                        return;
                    }
                    res.render("addExternalNote",{provider:"Onenote",notes:data.value});
                });
            })
            request.on('error', error => {
                console.error(error)
                res.render("error",{title:"PRoblem",error:"Error in the request"});
            })
            request.end();
            
        }else if(req.session.provider == 1){ //Evernote
            console.log("Looking for evernote notes with token: " + req.session.providerToken);
            
            let options = {
                host: config.evernoteEndpoint.host,
                port: config.evernoteEndpoint.port,
                path: "/evernote/notes",
                headers: {
                    'Authorization':'Bearer ' + req.session.providerToken
                }
            }
            const request = http.request(options, incoming => {
                console.log(`statusCode: ${incoming.statusCode}`);
                let data = "";
                incoming.on('data', function (chunk) {
                    data+=chunk;
                });
                incoming.on("end",()=>{
                    console.log("Notes retrieved:\n")
                    console.log(data);
                    data = JSON.parse(data);
                    if(incoming.statusCode != 200){
                        res.render("error",{error:"Problem with the retrieval of the notes"});
                        console.log(data);
                        return;
                    }
                    res.render("addExternalNote",{provider:"Evernote",notes:data});
                });
            })
            request.on('error', error => {
                console.error(error)
                res.render("error",{title:"Problem",error:"Error in the request"});
            })
            request.end();
        }else{
            console.log("Unexpected provider");
            res.render("error",{error:"Unexpected provider"});
        }
    });


    // View the content of a single note from onenote
    app.get("/manageNotes/view/external/onenote/:id",isLogged,(req,res)=>{
        noteId = req.params.id;
        let options = {
            host:"graph.microsoft.com",
            path:"/v1.0/me/onenote/pages/"+noteId+"/content",
            headers:{
                'Authorization': 'Bearer ' + req.session.providerToken
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
                    res.render("error",{error:"There was a problem retrieving the external note"});
                }else{
                    res.send(data);
                }
            });
        })
        
        request.on('error', error => {
            console.error(error);
            res.render("error",{error:"There was an error requesting the note"});
        })
        
        request.end();
    });

    app.get("/manageNotes/add/external/onenote/:id",isLogged,(req,res)=>{
        //TODO: implement
        
    });

    //View content of note from evernote
    app.get("/manageNotes/view/external/evernote/:id",isLogged,(req,res)=>{
        noteId = req.params.id;
        let options = {
            host:config.evernoteEndpoint.host,
            path:"/evernote/notes/"+noteId,
            port:config.evernoteEndpoint.port,
            headers:{
                'Authorization': 'Bearer ' + req.session.providerToken
            }
        }
        const request = http.request(options, incoming => {
            console.log(`statusCode: ${incoming.statusCode}`);
            let data = "";
            incoming.on('data', function (chunk) {
                data += chunk;
            });
            incoming.on("end",()=>{
                console.log("View note:" + data);
                if (incoming.statusCode != 200){
                    res.render("error",{error:"There was a problem retrieving the external note"});
                }else{
                    res.send(data);
                }
            });
        })
        
        request.on('error', error => {
            console.error(error);
            res.render("error",{error:"There was an error requesting the note"});
        })
        
        request.end();
    });


    app.get("/manageNotes/:id/view",isLogged,(req,res)=>{
        let options = {
            host:config.api.host,
            path:"/API/notes/" +req.params.id,
            port:config.api.port,
            headers:{
                'Authorization': 'Bearer ' + req.session.apiToken
            }
        }
        const request = http.request(options, incoming => {
            console.log(`statusCode: ${incoming.statusCode}`);
            let data = "";
            incoming.on('data', function (chunk) {
                data += chunk;
            });
            incoming.on("end",()=>{
                console.log("View note:" + data);
                if (incoming.statusCode != 200){
                    res.render("error",{error:data.error});
                }else{
                    res.render("viewNote",{note:JSON.parse(data)});
                }
            });
        })
        
        request.on('error', error => {
            console.error(error);
            res.render("error");
        })
        
        request.end();
    });
    

    //Edit this note
    app.post("/manageNotes/:id/view",isLogged,(req,res)=>{
        let payload = JSON.stringify({
            title: req.body.title,
            content: req.body.content,
            ownerId: req.session.userId,
            id: req.body.id
        });
        console.log(payload);
        let options = {
            host:config.api.host,
            path:"/API/notes/"+req.body.id,
            port:config.api.port,
            method: "PUT",
            headers:{
                'Authorization': 'Bearer ' + req.session.apiToken,
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        }

        const request = http.request(options, incoming => {
            console.log(`statusCode: ${incoming.statusCode}`);
            let data = "";
            incoming.on('data', function (chunk) {
                data+=chunk;
            });
            incoming.on("end",()=>{
                console.log(data);
                data = JSON.parse(data);
                if(incoming.statusCode != 200){
                    res.render("error",{error:data.error});
                    console.log(data);
                }else{
                    res.redirect("/manageNotes");
                }
                
            });
        })
        request.on('error', error => {
            console.error(error)
            res.render("error",{title:"PRoblem",error:"Error in the request"});
        })
        request.write(payload);
        request.end();
    });
    //delete this note
    app.get("/manageNotes/:id/delete",isLogged,(req,res)=>{
        let options = {
            host:config.api.host,
            path:"/API/notes/" +req.params.id,
            port:config.api.port,
            method:"DELETE",
            headers:{
                'Authorization': 'Bearer ' + req.session.apiToken
            }
        }
        const request = http.request(options, incoming => {
            console.log(`statusCode: ${incoming.statusCode}`);
            let data = "";
            incoming.on('data', function (chunk) {
                data += chunk;
            });
            incoming.on("end",()=>{
                console.log(data);
                if (incoming.statusCode != 204){
                    res.render("error",{error:data.error});
                }else{
                    res.redirect("/manageNotes");
                }
            });
        })
        
        request.on('error', error => {
            console.error(error);
            res.render("error");
        })
        
        request.end();
    });
    

    //share note
    app.post("/manageNotes/share",(req,res)=>{
        let noteId = req.body.id;
        let email = req.body.email;
        
        let payload = JSON.stringify({
            userEmail: email,
            noteId: noteId
        });
        console.log(payload);
        let options = {
            host:config.api.host,
            path:"/API/notes/"+noteId+"/shares",
            port:config.api.port,
            method: "POST",
            headers:{
                'Authorization': 'Bearer ' + req.session.apiToken,
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        }

        const request = http.request(options, incoming => {
            console.log(`statusCode: ${incoming.statusCode}`);
            let data = "";
            incoming.on('data', function (chunk) {
                data+=chunk;
            });
            incoming.on("end",()=>{
                console.log(data);
                data = JSON.parse(data);
                if(incoming.statusCode != 200){
                    res.render("error",{error:data.error});
                    console.log(data);
                }else{
                    res.redirect("/manageNotes");
                }
                
            });
        })
        request.on('error', error => {
            console.error(error)
            res.render("error",{title:"PRoblem",error:"Error in the request"});
        })
        request.write(payload);
        request.end();
    });
}
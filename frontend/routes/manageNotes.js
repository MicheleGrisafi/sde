const isLogged = require("./../middlewares/isLogged");
const http = require("http");
const https = require("https");
const config = require("./../config/config.json");

const util = require("util");

const cheerio = require('cheerio');

//Adapters



/*function onenoteToGeneral(onenoteNote){

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
    $("en-media").remove();
    
    return new Buffer($.html()).toString('base64');
}*/

function insertNote(note,externalId,req,res){
    let payload = JSON.stringify(note);
    console.log("Note to insert:" + payload);
    let options = {
        host:config.api.host,
        path:"/API/users/"+req.session.userId+"/notes",
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
                return;
            }
            // Check if it's an external note. If it is, then add link
            if(externalId != null){
                insertNoteLink(data.id,externalId,req,res);
            }else{
                res.redirect("/manageNotes");
            }
        });
    })
    request.on('error', error => {
        console.error(error)
        res.render("error",{title:"Problem",error:"Error in the request"});
    })
    request.write(payload);
    request.end();
}

function insertNoteLink(noteId,noteExternalId,req,res){
    let payload = JSON.stringify({
        noteExternalId:noteExternalId,
        userId: req.session.userId,
        provider: req.session.provider
    });
    let options = {
        host:config.api.host,
        path:"/API/notes/"+noteId+"/links",
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
                return;
            }
            res.redirect("/manageNotes");
        });
    })
    request.on('error', error => {
        console.error(error)
        res.render("error",{title:"Problem",error:"Error in the request"});
    })
    request.write(payload);
    request.end();
}

function editNote(title,content,lastUpdated,id){
    let payload = JSON.stringify({
        title: title,
        content: content,
        id: id,
        lastUpdated: lastUpdated
    });
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
        res.render("error",{title:"Problem",error:"Error in the request"});
    })
    request.write(payload);
    request.end();
}


module.exports = (app) => {
    
/**
 ************************** SHOW LIST OF NOTES
 */

    /* Show list of owned and shared notes to the users */
    app.get("/manageNotes",isLogged,(req,res)=>{
        let userNotes;
        let sharedNotes;
        
        //Create request to NoteSync backend. First for the owned notes, then for the shared notes
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
                //If no error is received then retrieve also the notes shared with the user
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
                        //If no error is received populate an html page with both sets of notes
                        sharedNotes = JSON.parse(data);
                        console.log("Users: \n" + util.inspect(userNotes) + "\nShared:\n"+util.inspect(sharedNotes));
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
    });

    //Get list of external notes to display the user
    app.get("/manageNotes/add/external",isLogged,(req,res)=>{
        //Decide which service to invoke based on the provider in session
        if(req.session.provider == null){
            console.log(req.session)
            res.redirect("/controlPanel")
        }else if(req.session.provider == 0){ //Onenote
            //Create a request to the Onenote endpoint. 
            let options = {
                host: config.onenoteEndpoint.host,
                port: config.onenoteEndpoint.port,
                path: "/onenote/notes",
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
                    if(incoming.statusCode == 401){
                        //Token is expired
                        console.log("Token expired! Get a refresh");
                        res.redirect("/linkOneNote/refresh");
                    }else if(incoming.statusCode != 200){
                        res.render("error",{error:data.error});
                    }else{
                        //Render the notes on the page
                        res.render("addExternalNote",{provider:"Onenote",notes:data});
                    }          
                });
            })
            request.on('error', error => {
                console.error(error)
                res.render("error",{title:"Problem",error:"Error in the request"});
            })
            request.end();
            
        }else if(req.session.provider == 1){ //Evernote
        
            //Create a request to the Evernote endpoint. 
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
                    //Render the notes on the page
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
    
/**
 ************************** VIEW CONTENT OF NOTES
 */

    // View the content of a single note from onenote
    app.get("/manageNotes/view/external/onenote/:id",isLogged,(req,res)=>{
        let noteId = req.params.id;
        let options = {
            host:config.onenoteEndpoint.host,
            path:"/onenote/notes/"+noteId,
            port:config.onenoteEndpoint.port,
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
                    //Return the raw html data
                    data = JSON.parse(data);
                    let content = new Buffer(data.content, 'base64').toString('ascii');
                    console.log("Content of note: " + content);
                    res.send(content);
                }
            });
        })
        
        request.on('error', error => {
            console.error(error);
            res.render("error",{error:"There was an error requesting the note"});
        })
        
        request.end();
    });

    //View content of note from evernote
    app.get("/manageNotes/view/external/evernote/:id",isLogged,(req,res)=>{
        let noteId = req.params.id;

        // Create request to Evernote endpoint.
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
                    //Return the raw html data
                    data = JSON.parse(data);
                    console.log(util.inspect(data));
                    let content = new Buffer(data.content, 'base64').toString('ascii');
                    res.send(content);
                }
            });
        })
        
        request.on('error', error => {
            console.error(error);
            res.render("error",{error:"There was an error requesting the note"});
        })
        
        request.end();
    });

    // View content of a note from the NoteSync backend
    app.get("/manageNotes/:id/view",isLogged,(req,res)=>{
        //Create request to NoteSync backend
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
                    data = JSON.parse(data);
                    data.content = new Buffer(data.content, 'base64').toString('ascii');
                    res.render("viewNote",{note:data});
                }
            });
        })
        
        request.on('error', error => {
            console.error(error);
            res.render("error",{error:"There was an error requesting the note"});
        })
        
        request.end();
    });
    
/**
 ************************** ADD NOTE TO NOTESYNC
 */

    /* Add a note to the list of owned note given a certain content in the body of the request*/
    app.post("/manageNotes/add",isLogged,(req,res)=>{
        let title=req.body.title;
        let content=req.body.content;

        //Create a note object to be sent to the NoteSync backend
        let payload = {
            title: title,
            content: new Buffer(content).toString('base64'),
            lastUpdated: Math.round(Date.now()/1000)
        }
        insertNote(payload,null,req,res);
    });
    
    // Add the external onenote note to the NoteSync backend collection
    app.get("/manageNotes/add/external/onenote/:id",isLogged,(req,res)=>{
        let noteId = req.params.id;

        let options = {
            host:config.onenoteEndpoint.host,
            path:"/onenote/notes/"+noteId,
            port:config.onenoteEndpoint.port,
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
                    //Return the raw html data
                    let note = JSON.parse(data);
                    insertNote(note,noteId,req,res);
                }
            });
        })
        
        request.on('error', error => {
            console.error(error);
            res.render("error",{error:"There was an error requesting the note"});
        })
        
        request.end();
        
    });

    // Add the external evernote note to the NoteSync backend collection
    app.get("/manageNotes/add/external/evernote/:id",isLogged,(req,res)=>{
        let noteId = req.params.id;

        //Create request to evernote endpoint to fetch the note
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
                    // The note has been fetched, now we add to it to the NoteSync backend
                    data = JSON.parse(data);
                    insertNote(data,noteId,req,res);
                }
            });
        })
        
        request.on('error', error => {
            console.error(error);
            res.render("error",{error:"There was an error requesting the note"});
        })
        
        request.end();
    });

/**
 ************************** EDIT NOTES
 */

    //Edit this note
    app.post("/manageNotes/:id/edit",isLogged,(req,res)=>{
        editNote(req.body.title,new Buffer(req.body.content).toString('base64'),Math.round(Date.now()/1000),parseInt(req.body.id));
    });

/**
 ************************** DELETE NOTES
 */

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
    
    app.get("/manageNotes/:id/delete/shares/:shareId",isLogged,(req,res)=>{
        console.log("Sending request: " + "/API/notes/" +req.params.id+"/shares/"+req.params.shareId);
        let options = {
            host:config.api.host,
            path:"/API/notes/" +req.params.id+"/shares/"+req.params.shareId,
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

/**
 ************************** SHARE NOTES
 */

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
            res.render("error",{title:"Problem",error:"Error in the request"});
        })
        request.write(payload);
        request.end();
    });

/**
 * ************************ UPDATE EXTERNAL NOTE
 */
    app.get("/manageNotes/:id/sync", (req,res)=>{
        let externalNote={}
        let internalNote={}
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
                    data = JSON.parse(data);
                    internalNote = data;

                    //Get external note
                    let options = {
                        host:config.onenoteEndpoint.host,
                        path:"/onenote/notes/"+noteId,
                        port:config.onenoteEndpoint.port,
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
                                //Return the raw html data
                                data = JSON.parse(data);
                                let content = new Buffer(data.content, 'base64').toString('ascii');
                                console.log("Content of note: " + content);
                                res.send(content);
                            }
                        });
                    })
                    
                    request.on('error', error => {
                        console.error(error);
                        res.render("error",{error:"There was an error requesting the note"});
                    })
                    
                    request.end();



                }
            });
        })
        
        request.on('error', error => {
            console.error(error);
            res.render("error",{error:"There was an error requesting the note"});
        })
        
        request.end();
        
        if(externalNotes.lastUpdated > internalNote.lastUpdated){
            //Fetch update from external provider to NoteSync

        }else if(externalNotes.lastUpdated < internalNote.lastUpdated){
            //Push update from NoteSync to external Provider
            res.render("error",{error:"There are not updates to fetch"});
        }

    });
}
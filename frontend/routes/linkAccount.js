/* Connect the user to one account */
const isLogged   = require("./../middlewares/isLogged");
const oneNoteUrl    = "https://login.live.com/oauth20_authorize.srf?";
const oneNoteID     = "ffd0ff8d-9f9f-44f5-b325-d3d375650d63";
const oneNoteSecret = "Bakza3@RQrf02u0V_Q]_W@VZCI=op/gJ";

const oneNoteScope  = "Notes.ReadWrite offline_access User.Read" // onedrive.readwrite office.onenote_update";

const http = require("http");
const https = require("https");
const config = require("../config/config.json");
const querystring = require("querystring");
const Evernote = require('evernote');
const client = new Evernote.Client({
    consumerKey: config.evernote.id,
    consumerSecret: config.evernote.secret,
    sandbox: config.evernote.sandbox,
    china: false,
});
const util = require("util");
const oneNoteRedirect = config.development.protocol+"://"+config.development.host+":"+config.development.port + "/linkOneNote";
const callbackUrlEvernote = config.development.protocol+"://"+config.development.host+":"+config.development.port +"/linkEvernote/callback";

function insert_token(req,res,provider,token){
    let payload = JSON.stringify({
        provider: provider,
        providerToken: token
    });
    let options = {
        host:config.api.host,
        path:"/API/users/"+req.session.userId,
        port:config.api.port,
        method: "PUT",
        headers:{
            'Authorization': 'Bearer ' + req.session.apiToken,
            'Content-Type': 'application/json',
            'Content-Length':payload.length
        }
    }

    const request = http.request(options, incoming => {
        console.log(`statusCode: ${incoming.statusCode}`);
        let data = "";
        incoming.on('data', function (chunk) {
            data += chunk;
        });
        incoming.on("end",()=>{
            if(incoming.statusCode == 204){
                req.session.providerToken = token;
                req.session.provider= provider;
                res.redirect("/controlPanel");
            }else{
                data =  JSON.parse(data);
                console.log("error:"+util.inspect(data, {showHidden: false, depth: null}));
                res.render("error",{error:data.error});
            }
        });
    })
    request.on('error', error => {
        console.error(error);
        res.render("error",{error:"There was an error with the request"});
    })
    request.write(payload);
    request.end();
}


module.exports = (app) => {
    // PREPARE PAGE OFFERING THE CHOICE FOR THE TWO NOTE PLATFORMS
    app.get("/linkAccount",isLogged,(req,res)=>{
        if(req.session.provider != null){
            res.render("error",{error:"The account is already linked"});
        }else{
            var string = oneNoteUrl + 'client_id='+encodeURIComponent(oneNoteID)+"&response_type=code&redirect_uri="+encodeURIComponent(oneNoteRedirect)+"&scope="+encodeURIComponent(oneNoteScope);
            console.log(string);
            res.render("linkAccount",{oneNoteLink:string, evernoteLink:"/linkEvernote"});
        }
    });

    //ONE NOTE PAGE HAS BEEN CHOSEN AND THE FLOW HAS BEEN REDIRECTED TO THE PAGE
    app.get("/linkOneNote",isLogged,(req,res)=>{
        //THE CODE HAS BEEN RECEIVED
        if(req.query.code != null){
            //EXCHANGE THE CODE FOR THE TOKEN
            let payload = querystring.stringify({
                client_id: oneNoteID,
                scope: oneNoteScope,
                code: req.query.code,
                redirect_uri:oneNoteRedirect,
                resource:"https://graph.microsoft.com/",
                grant_type:"authorization_code",
                client_secret:oneNoteSecret
            })
            let options = {
                host:"login.live.com",
                path:"/oauth20_token.srf",
                port:443,
                method: "POST",
                headers:{
                    'Content-Type':'application/x-www-form-urlencoded',
                    'Content-Length':payload.length
                }
            }
        
            const request = https.request(options, incoming => {
                console.log(`statusCode: ${incoming.statusCode}`);
                let data = "";
                incoming.on('data', function (chunk) {
                    data += chunk;
                });
                incoming.on("end",()=>{
                    if(incoming.statusCode == 200){
                        //TODO: also save the refresh token
                        let token = JSON.parse(data).access_token; 
                        console.log("Token is:\n "+data);
                        insert_token(req,res,0,token);
                    }else{
                        console.log("Error with the token request. PAyload was " + payload);
                        res.send(data);
                    }
                });
            })
            request.on('error', error => {
                console.error(error);
                res.render("error",{error:"There was an error with the request"});
            })
            request.write(payload);
            request.end();
        }else{
            console.log("No code");
            res.render("error",{error:"There was an error handling the request"});
        }       
    });
    
    
    
    app.get("/linkEvernote",isLogged,(req,res)=>{
        // Temporary request to Evernote
        

        client.getRequestToken(callbackUrlEvernote, function(error, oauthToken, oauthTokenSecret,results) {
            if (error) {
                console.log(error);
                res.render("error",{error:"request token failed"});
            }else{
                req.session.evernoteToken = oauthToken;
                req.session.evernoteTokenSecret = oauthTokenSecret;
                res.redirect(client.getAuthorizeUrl(oauthToken)); // send the user to Evernote
            }
            
        });
    });

    app.get("/linkEvernote/callback",isLogged,(req,res)=>{
        console.log("Evernote Callback\n");
        client.getAccessToken(req.session.evernoteToken,
            req.session.evernoteTokenSecret,
            req.query.oauth_verifier,
            function(error, oauthToken) {
                if (error) {
                // do your error handling
                    console.log("Error:\n" + error);
                    res.send(error.data)
                } else {
                    console.log("Success: token is\n"+oauthToken);
                    insert_token(req,res,1,oauthToken);

                    
                }
            }
        );

    });
}


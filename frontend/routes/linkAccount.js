/* Connect the user to one account */
const isLogged   = require("./../middlewares/isLogged");
const oneNoteUrl    = "https://login.live.com/oauth20_authorize.srf?";
const oneNoteID     = "ffd0ff8d-9f9f-44f5-b325-d3d375650d63";
const oneNoteSecret = "Bakza3@RQrf02u0V_Q]_W@VZCI=op/gJ";
const oneNoteRedirect = "http://localhost:8000/linkOneNote";
const oneNoteScope  = "offline_access notes.readwrite.all";
const evernoteID     = "miki426811";
const evernoteSecret= "b63e9e413579072c";
const http = require("http");
const APIhost = "localhost";
const APIport = 9000;
const APIpath = "/API/token";

const Evernote = require('evernote');

function request_token(accessCode){
    const request = require('sync-request');
    const querystring = require("querystring");
    let res = request('POST','https://login.live.com/oauth20_token.srf', {
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:querystring.stringify({
            client_id: oneNoteID,
            scope: oneNoteScope,
            code: accessCode,
            redirect_uri:oneNoteRedirect,
            grant_type:"authorization_code",
            client_secret:oneNoteSecret
        })}
    );
    if(res.statusCode == 200){
        return JSON.parse(res.getBody('utf8')); 
    }
    return null;
}

function insert_token(req,res,provider,token){
    let payloadJSON = '{"token":"'+token+'","provider":'+provider+',"email":"'+req.session.email+'"}';
    let options = {
        host:APIhost,
        path:APIpath,
        port:APIport,
        method: "POST",
        headers:{
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + req.session.token,
        }
    }

    const request = http.request(options, incoming => {
        console.log(`statusCode: ${incoming.statusCode}`);
        incoming.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            let token = JSON.parse(chunk);
            if (token != null){
                req.session.email = req.body.email;
                if (provider == 1)
                    req.session.onenote = token.token;
                else if(provider == 2)
                    req.session.evernote = token.token;
                res.redirect("/controlPanel");
            }
        });
    })
    request.on('error', error => {
        console.error(error)
    })
    request.write(payloadJSON);
    request.end();
}


module.exports = (app) => {
    // PREPARE PAGE OFFERING THE CHOICE FOR THE TWO NOTE PLATFORMS
    app.get("/linkAccount",isLogged,(req,res)=>{
        var string = oneNoteUrl + 'client_id='+encodeURIComponent(oneNoteID)+"&response_type=code&redirect_uri="+encodeURIComponent(oneNoteRedirect)+"&scope="+encodeURIComponent(oneNoteScope);
        console.log(string);
        res.render("linkAccount",{oneNoteLink:string, evernoteLink:"/linkEvernote"});
    });

    //ONE NOTE PAGE HAS BEEN CHOSEN AND THE FLOW HAS BEEN REDIRECTED TO THE PAGE
    app.get("/linkOneNote",isLogged,(req,res)=>{
        let ses = req.session;
        //THE CODE HAS BEEN RECEIVED
        if(req.query.code != null){
            //EXCHANGE THE CODE FOR THE TOKEN
            let token = request_token(req.query.code);
            if(token != null){
                // TOKEN HAS BEEN RECEIVED
                insert_token(req,res,1,token);
            }else{
                res.send("There was an error handling the request");
            }
        }else{
            res.send("There was an error handling the request");
        }       
    });
    
    
    
    app.get("/linkEvernote",isLogged,(req,res)=>{
        // Temporary request to Evernote
        let callbackUrl = "http://localhost:8000/linkEvernote/callback";
        
        var client = new Evernote.Client({
            consumerKey: evernoteID,
            consumerSecret: evernoteSecret,
            sandbox: true, // change to false when you are ready to switch to production
            china: false, // change to true if you wish to connect to YXBJ - most of you won't
        });
        client.getRequestToken(callbackUrl, function(error, oauthToken, oauthTokenSecret) {
            if (error) {
              // do your error handling here
              console.log(error);
              res.render("error",{error:"request token failed"});
            }else{
                // store your token here somewhere - for this example we use req.session
                req.session.evernoteToken = oauthToken;
                req.session.evernoteTokenSecret = oauthTokenSecret;
                res.redirect(client.getAuthorizeUrl(oauthToken)); // send the user to Evernote
            }
            
        });
    });

    app.get("/linkEvernote/callback",isLogged,(req,res)=>{
        console.log("Callback\n");
        var client = new Evernote.Client({
            consumerKey: evernoteID,
            consumerSecret: evernoteSecret,
            sandbox: true,
            china: false,
        });
        client.getAccessToken(req.session.evernoteToken,
            req.session.evernoteTokenSecret,
            req.query.oauth_verifier,
            function(error, oauthToken, oauthTokenSecret, results) {
                if (error) {
                // do your error handling
                    console.log(error);
                    res.render("error",{error:"There was an error processing the request"})
                } else {
                    // oauthAccessToken is the token you need;
                    console.log("Success: token is\n"+oauthToken);
                    /*var authenticatedClient = new Evernote.Client({
                        token: oauthToken,
                        sandbox: true,
                        china: false,
                    });*/
                    insert_token(req,res,2,oauthToken);
                    //res.send(oauthToken);
                    //var noteStore = authenticatedClient.getNoteStore();
                    
                }
            }
        );

    });
}


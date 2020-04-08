/* User registration */

const http = require("http");
const https = require("https");
const config = require("../config/config.json");
const {google} = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
    "295784679349-9b1qurnosbj8hqv7v6agf04elitig0op.apps.googleusercontent.com",
    "b1cFrNuR3Wa0W9YPSveMnfeg",
    "http://localhost:8000/signup/google/callback"
);
const util = require('util');

module.exports = (app) => {
    app.post("/signup", (req, res) => {
        if (req.body.password == req.body.confirmPassword){
            let data = JSON.stringify({
                email: req.body.email,
                password: req.body.password,
            });
            const options = {
                hostname: config.api.host,
                port: config.api.port,
                path: '/API/users',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            }
              
            const request = http.request(options, response => {
                console.log(`statusCode: ${response.statusCode}`)
                let data = '';
                response.on('data', chunk => {
                    data += data + chunk;
                })
                response.on('end', () => {
                    console.log("Body:"+data);
                    result = JSON.parse(data);
                    if (response.statusCode == 200){
                        
                        req.session.apiToken = result.apiToken;
                        req.session.userId = result.id;
                        req.session.userEmail = result.email;
                        res.redirect("/controlPanel");
                    }else{
                        res.render("error",{title:"Error",error:"The user was not registered! "+result.error});
                    }
                });
            })
            
            request.on('error', error => {
                console.error(error)
                res.render("error",{title:"PRoblem",error:"Error in the request"});
            })
            request.write(data);
            request.end();
            
        }else{
            console.log("Password don't match");
            res.render("error",{title:"PRoblem",error:"PAssword do not match"});
        }
    });
    
    app.get("/signup/google", (req,res)=>{
        // generate a url that asks permissions for Blogger and Google Calendar scopes
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email'
        ];

        const url = oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
            access_type: 'online',

            // If you only need one scope you can pass it as a string
            scope: scopes
        });
        console.log(url);
        res.redirect(url);
    });

    app.get("/signup/google/callback", (req,res)=>{
        console.log("callback called");
        let code = req.query.code;
        oauth2Client.getToken(code)
        .then((result)=>{
            if(result.res.status != 200){
                console.log(util.inspect(result, false, null, true /* enable colors */));
                res.render("error",{error:"error in callback"});
                return;
            }
            let idToken = result.tokens.id_token;
            let data = JSON.stringify({
                gtoken: idToken
            });
            const options = {
                hostname: config.api.host,
                port: config.api.port,
                path: '/API/users',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            }
              
            const request = http.request(options, response => {
                console.log(`statusCode: ${response.statusCode}`)
                let data = '';
                response.on('data', chunk => {
                    data += data + chunk;
                })
                response.on('end', () => {
                    console.log("Body:"+data);
                    result = JSON.parse(data);
                    if (response.statusCode == 200){
                        res.render("userCreated",{title:"Signup successful",userid:result.id, token:result.apiToken});
                        req.session.apiToken = result.apiToken;
                        req.session.userId = result.id;
                        req.session.userEmail = result.email;
                    }else{
                        res.render("error",{title:"Error",error:"The user was not registered! "+result.error});
                    }
                });
            })
            
            request.on('error', error => {
                console.error(error)
                res.render("error",{title:"PRoblem",error:"Error in the request"});
            })
            request.write(data);
            request.end();
            //oauth2Client.setCredentials(tokens);
        }).catch((err)=>{
            console.log(err);
            res.render("error",{error:err});
        })
    });

    app.get("/signup", (req, res) => { 
        res.render("signup",{title:"Signup PAge"});
    });
}


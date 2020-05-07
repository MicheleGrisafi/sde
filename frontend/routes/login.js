const http = require("http");
const config = require("./../config/config.json");
const {google} = require('googleapis');
const oauth2Client = new google.auth.OAuth2(
    "295784679349-9b1qurnosbj8hqv7v6agf04elitig0op.apps.googleusercontent.com",
    "b1cFrNuR3Wa0W9YPSveMnfeg",
    "http://localhost:8000/login/google/callback"
);
const isLogged = require("./../middlewares/isLogged");
const notLogged = require("../middlewares/notLogged");

module.exports = (app) => {
    app.post("/login", notLogged,(req, res) => {
        let queryString = "email="+encodeURI(req.body.email)+"&password="+encodeURI(req.body.password);
        
        let options = {
            host:config.api.localhost,
            path:"/API/users" + "?"+queryString,
            port:config.api.port,
            method: "GET"
        }

        const request = http.request(options, incoming => {
            console.log(`statusCode: ${incoming.statusCode}`);
            let data = "";
            incoming.on('data', function (chunk) {
                data += chunk;
            });
            incoming.on("end",()=>{
                console.log("User retrieved: " + data);
                let result = JSON.parse(data);

                if(incoming.statusCode != 200){
                    res.render("error",{error:result.error});
                }else{
                    req.session.apiToken = result.apiToken;
                    req.session.userId = result.id;
                    req.session.userEmail = result.email;
                    req.session.providerToken = result.providerToken;
                    req.session.provider = result.provider;
                    req.session.refreshToken = result.refreshToken;
                    res.redirect("/controlPanel");
                }
            });

        })
        request.on('error', error => {
            console.error(error);
            res.render("error",{error:"Error in the request"});
        })
        request.end();
    });

    app.get("/login/google",notLogged,(req,res)=>{
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
    })
    
    app.get("/login/google/callback",notLogged,(req,res)=>{
        console.log("Login Google callback called");
        let code = req.query.code;
        oauth2Client.getToken(code)
        .then((result)=>{
            console.log("Google response received");
            if(result.res.status != 200){
                console.log(util.inspect(result, false, null, true /* enable colors */));
                res.render("error",{error:"error in callback"});
                return;
            }
            let idToken = result.tokens.id_token;
            const options = {
                hostname: config.api.host,
                port: config.api.port,
                path: '/API/users?gtoken=' + encodeURI(idToken),
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
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
                        req.session.providerToken = result.providerToken;
                        req.session.provider = result.provider;
                        res.redirect("/controlPanel");
                    }else{
                        res.render("error",{title:"Error",error:"Could not login: "+result.error});
                    }
                });
            })
            
            request.on('error', error => {
                console.error(error)
                res.render("error",{title:"PRoblem",error:"Error in the request"});
            })
            request.end();
            //oauth2Client.setCredentials(tokens);
        }).catch((err)=>{
            console.log(err);
            res.render("error",{error:err});
        })
    });

    app.get("/login", notLogged,(req, res) => {
        res.render("login",{title:"Login Page"});
    });
    app.get("/logout",isLogged, (req, res) => {
        req.session.destroy();
        res.redirect("/");
        console.log("SEssion erased");        
    });
}
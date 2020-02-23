const http = require("http");
const config = require("./../config/config.json");



module.exports = (app) => {
    app.post("/login", (req, res) => {
        if (req.session.email != null){
            res.redirect("/");
            return;
        }
        let payload = encodeURI("email="+req.body.email+"&password="+req.body.password);
        
        //TODO implement crypto
        
        let options = {
            host:config.api.localhost,
            path:config.api.token + "?"+payload,
            port:config.api.port
        }

        const request = http.request(options, incoming => {
            console.log(`statusCode: ${incoming.statusCode}`);
            incoming.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
                let token = JSON.parse(chunk);
                if (token != null){
                    req.session.email = req.body.email;
                    req.session.token = token.token;
                    res.redirect("/controlPanel");
                }
            });
        })
        
        request.on('error', error => {
            console.error(error)
        })
        
        request.end();

    });
    app.get("/login", (req, res) => {
        res.render("login",{title:"Login Page"});
    });
}
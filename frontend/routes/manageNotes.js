const isLogged = require("./../middlewares/isLogged");
const http = require("http");
const config = require("./../config/config.json");

module.exports = (app) => {
    app.get("/manageNotes",isLogged,(req,res)=>{
        let userNotes;
        let sharedNotes;
        
        /*let payload = "email="+encodeURI(req.session.email)+""
        
        let options = {
            host:config.api.host,
            path:config.api.note + "?"+payload,
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
        
        request.end();*/
        res.render("manageNotes",{notes:{},shared:{}});
    });

    app.get("/manageNotes/add",isLogged,(req,res)=>{
        provider = req.params.provider;
        let payload = 'email='+encodeURI(req.session.email);
        let options = {
            host:config.api.host,
            path:config.api.note+"/"+provider+"?"+payload,
            port:config.api.port,
            method: "GET",
            headers:{
                'Authorization': 'Bearer ' + req.session.token
            }
        }

        const request = http.request(options, incoming => {
            console.log(`statusCode: ${incoming.statusCode}`);
            incoming.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
                
            });
        })
    
        
    });
    app.get("/manageNotes/add/onenote",isLogged,(req,res)=>{
        res.render("")
    });

    app.get("/manageNotes/:id/view",isLogged,(req,res)=>{
        
    });
}
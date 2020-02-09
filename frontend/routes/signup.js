/* User registration */
const APIpath = "/API/user";
const APIserver = "http://localhost";
const APIport = "9000";
const request = require('sync-request');



function send_post(payload,path,host,port){
    var res = request('POST', host+":"+port+path, {
        json: payload,
    });
    var result = res.getBody('utf8');
    return result;
}


module.exports = (app) => {
    app.post("/signup", (req, res) => {
        if (req.body.password == req.body.confirmPassword){
            let payload = {
                email: req.body.email,
                password: req.body.password 
            }
            let result = send_post(payload,APIpath,APIserver,APIport);
            console.log(result);
            result = JSON.parse(result);
            if (result.hasOwnProperty("token")){
                res.render("userCreated",{title:"Signup successful",email:req.body.email, token:result.token});
            }else{
                res.render("error",{title:"Error",error:"The user was not registered!"});
            }
            
        }else{
            console.log("PAssword not match");
            res.render("index",{title:"PRoblem"});
        }
    });
    app.get("/signup", (req, res) => {
        
        res.render("signup",{title:"Signup PAge"});
        
    });
}


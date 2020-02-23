const jwt = require('jsonwebtoken');
const send_error = require("../../modules/send_error");
const fs = require('fs');
const publicKey = fs.readFileSync(__dirname+'/../../crypto/sde.key.pub');

function verify_access_token(access_token,req){
    try {
        var decoded = jwt.verify(access_token, publicKey,{ algorithms: ['RS256']});
        console.log(decoded);
        
        if (req.body.email != decoded.email && req.query.email != decoded.email){
            console.log("email:" + req.body.email + " while decoded is " + decoded.email);
            return false
        }
    }catch(err) {
        console.log(err);
        return false;
    }
    return true;
}



module.exports =  function(req, res, next){
    console.log("Checking the presence of the token!");
    auth_header = req.header('Authorization');
    if(auth_header == null || auth_header.search("Bearer") < 0){
        send_error(res,"No JWT token found! You need one to access the APIs!",400);
        return;
    }
    access_token = auth_header.substr(7,auth_header.len);
    if(!verify_access_token(access_token,req)){
        send_error(res,"Access token is invalid.",400);
        return;
    }
    next();
}
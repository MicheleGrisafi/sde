const send_error = require("../../modules/send_error");
const jwt = require("../../modules/token");

// Check whether the JWT token for the API exists and it's valid
module.exports =  function(req, res, next){
    console.log("Checking the presence of the token!");
    access_token = jwt.extract_token(req);
    if(access_token == null || jwt.decode_access_token(access_token) == null){
        send_error.bad_token(res);
        return;
    }
    next();
}
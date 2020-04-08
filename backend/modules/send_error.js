module.exports = {
    bad_token: function (res){
        res.status(400);
        let msg = "The authentication token is not valid";
        res.send('{"error":"'+msg+'"}');
    },
    bad_gtoken: function (res){
        res.status(400);
        let msg = "The google authentication token is not valid";
        res.send('{"error":"'+msg+'"}');
    },
    bad_request: function (res){
        res.status(400);
        let msg = "Malformed request";
        res.send('{"error":"'+msg+'"}');
    }, 
    existing_user:function (res){
        res.status(500);
        let msg = "User already exists";
        res.send('{"error":"'+msg+'"}');
    },
    unauthorized:function (res){
        res.status(401);
        let msg = "You are not authorized to access this resource";
        res.send('{"error":"'+msg+'"}');
    },
    internal_error:function (res){
        res.status(500);
        let msg = "There has been an internal error";
        res.send('{"error":"'+msg+'"}');
    },
    nonExistingUser:function (res){
        res.status(400);
        let msg = "The user does not exist";
        res.send('{"error":"'+msg+'"}');
    },
}
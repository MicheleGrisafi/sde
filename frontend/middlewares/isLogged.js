const util = require('util');

module.exports =  function(req, res, next){
    console.log("Checking If the user is logged in!");
    if (req.session.userEmail == null){
        res.redirect("/");
        console.log("NOT LOGGED IN. SEssion: " + util.inspect(req.session, false, null, true /* enable colors */));
        return;
    }
    next();
}
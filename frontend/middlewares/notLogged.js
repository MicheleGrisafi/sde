
module.exports =  function(req, res, next){
    console.log("Checking If the user is logged in!");
    if (req.session.userEmail != null){
        res.redirect("/controlPanel");
        console.log("Already logged");
        return;
    }
    next();
}
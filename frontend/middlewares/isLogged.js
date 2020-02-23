module.exports =  function(req, res, next){
    console.log("Checking If the user is logged in!");
    if (req.session.email == null){
        res.redirect("/");
        return;
    }
    next();
}
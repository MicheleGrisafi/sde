


module.exports = (app) => {
    app.get("/controlPanel",(req,res)=>{
        res.render("controlPanel",{email:req.session.userEmail});
    });
}

const isLogged = require("./../middlewares/isLogged");


module.exports = (app) => {
    app.get("/controlPanel",isLogged,(req,res)=>{
        res.render("controlPanel",{email:req.session.userEmail});
    });
}
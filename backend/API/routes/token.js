/* API for the TOKEN object */
//TODO: check if the owner is authenticated
//TODO: manage the expiration of the tokens
const checkToken = require("../middlewares/checkToken");
const send_error = require("../../modules/send_error");
const fs = require('fs');

 
module.exports = (app, db) => {
    //Get token
    app.get( "/API/token", (req, res) =>{
        //TODO: implement crypto
        let email = req.query.email;
        let password = req.query.password;
        let callback = req.query.callback;
        let user = null;
        db.User.findByPk(email).then((result)=>{
            console.log("Finished");
            user=result;
            
            
        }).catch((err)=>{
            console.log("ERR:"+err);
            allow=true;
        });
    });
    app.get( "/token/:email", (req, res) =>
        db.Note.findByPk(req.params.email).then( (result) => res.json(result))
    );
  
    //Create new token
    app.post("/API/token", checkToken, (req, res) => {
        let provider = 0;
        db.Token.create({
            title: req.body.title,
            content: req.body.content,
            owner: req.body.owner,
            provider: provider,
        })
        .then((result) => {
            console.log(result);
            res.status(200);
            res.send('{"msg":"Token correctly created"}');
        })
        .catch((err) => {
            console.log(err);
            send_error(res,"There was an error creating the token",500);
        })
    });
}


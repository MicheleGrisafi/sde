/* END point for authorization grant */
const ISSUER = "localhost";
const JWT_LIFE_SPAN = 60*60*24*365; //1 year
const send_error = require("../../modules/send_error");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const privateKey = fs.readFileSync(__dirname+'/../../crypto/sde.key');

module.exports = (app,db) => {
    app.post("/auth/onenote",(req,res)=>{
        
        db.Token.create({
            owner: req.body.owner,
            provider: 1,
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
    })
}


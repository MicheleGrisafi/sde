/* API for the USER object */
const checkToken = require("../middlewares/checkToken");
const ISSUER = "localhost";
const JWT_LIFE_SPAN = 60*60*24*365; //1 year
const send_error = require("../../modules/send_error");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const privateKey = fs.readFileSync(__dirname+'/../../crypto/sde.key');

module.exports = (app, db) => {
    //Retrieve the user
    //TODO:
    app.get( "/API/user",checkToken, (req, res) =>
        db.User.findAll().then( (result) => res.json(result) )
    );

    app.get( "/user/:email", (req, res) =>
        db.User.findByPk(req.params.email).then( (result) => res.json(result))
    );
    
    //TODO:
    //Create new user --> no middleware
    app.post("/API/user", (req, res) => {
        db.User.create({
            email: req.body.email,
            password: req.body.password
        })
        .then((result) => {
            // CREATE TOKEN
            console.log(result);
            var dt = new Date();
            let payload = {
                "iss": ISSUER,
                "exp": dt.getTime() + JWT_LIFE_SPAN,
                "email":result.email
            }
            let token = jwt.sign(payload,privateKey,{ algorithm: 'RS256'});
            db.Token.create({
                provider: 0,
                jsonToken:token,
                owner: result.email
            }).then((result)=>{
                console.log(result);
                let response = '{ "token":"'+token+'"}';
                res.send(response);
            }).catch((err)=>{
                console.log(err);
                send_error(res,"There was a problem creating the token",500);
            });
        })
        .catch((err) => {
            console.log(err);
            send_error(res,"user already exists",500);
        })
    });
}


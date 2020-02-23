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
    
    /* CREATE A NEW USER
    PARAMS: 
        -gtoken --> google signing token 
        -email
        -password
    RETURN:
        - token for API    
    */
    
    app.post("/API/user", (req, res) => {
        let gsignup = null; 
        let email = null;
        let password = null;
        if(req.body.gtoken){
            gsignup=1;
        }else if(req.body.email != null && req.body.password != null){
            gsignup = 0;
        }
        if(gsignup == null){
            send_error(res,"Wrong parameters",400);
            return;
        }else if(!gsignup){
            email = req.body.email;
            password = req.body.password;
        }else{
            //Verify google JWT
            const {OAuth2Client} = require('google-auth-library');
            const CLIENT_ID = "295784679349-66i3plj6m0jmedb0pk3ptcgsc9bomqgr.apps.googleusercontent.com";
            const client = new OAuth2Client(CLIENT_ID);
            async function verify() {
                const ticket = await client.verifyIdToken({
                    idToken: gtoken,
                    audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
                });
                const payload = ticket.getPayload();
                const userid = payload['sub'];
                console.log("payload:"+payload);
            }
            verify().catch(console.error);
        }
        console.log("Gtoken verified");
        /*
        db.User.create({
            email: email,
            password: password
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
                jwt:token,
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
        })*/
    });
}


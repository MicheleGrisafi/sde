/* API for the USER object */
const checkToken = require("../middlewares/checkToken");
const send_error = require("../../modules/send_error");
const jwt = require("../../modules/token");
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = "295784679349-9b1qurnosbj8hqv7v6agf04elitig0op.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);
const util = require('util');

module.exports = (app, db) => {
    //Retrieve the user
    app.get( "/API/users", (req, res) =>{
        let email = req.query.email;
        let password = req.query.password;
        let gtoken = req.query.gtoken;
        if(email != null && password != null){ //Authenticate using password and email
            db.User.findOne({where: {email: email,password: password} })
            .then((result)=>{
                console.log("Sending: " + result);
                if(result != null){
                    res.send(result);
                }else{
                    send_error.nonExistingUser(res);
                }
            })
            .catch((err)=>{
                console.log(err);
                send_error.internal_error(res);
            })
        }else if( gtoken != null){
            verify(gtoken)
            .then((result)=>{
                db.User.findOne({where: {email: result.email} })
                .then((result)=>{
                    console.log("Sending: " + result);
                    if(result != null){
                        res.send(result);
                    }else{
                        send_error.nonExistingUser(res);
                    }
                })
                .catch((err)=>{
                    console.log(err);
                    send_error.internal_error(res);
                })
            })
            .catch((error)=>{
                console.log(error);
                send_error.internal_error(res);
            });
        }else{
            console.log(req.query);
            send_error.bad_request(res);
        }
    });

    app.get( "/API/users/:userId",checkToken, (req, res) =>{
        let tokenPayload = jwt.decode_access_token(jwt.extract_token(req));
        db.User.findByPk(tokenPayload.id)
        .then((result)=>{
            res.send(result);
        })
        .catch((err)=>{
            console.log(err);
            send_error.bad_token(res);
        });
    });
    
    app.post("/API/users", (req, res) => {
        let gtoken = req.body.gtoken;
        let email = req.body.email;
        let password = req.body.password;

        //Check which type of signup has been chosen
        if(gtoken == null && (email == null || password == null)){
            send_error.bad_request(res);
            return;
        }else if(gtoken == null){ //Normal signup
            createUser(email,password,db,res);
        }else{ //Google signup
            //Verify google JWT
            verify(gtoken)
            .then((result)=>{
                createUser(result.email,null,db,res);
            })
            .catch((error)=>{
                console.log(error);
                send_error.bad_gtoken(res);
            });
        }      
    });

    app.put("/API/users/:userId", checkToken, (req,res)=>{
        let provider = req.body.provider;
        let providerToken = req.body.providerToken;
        let refreshToken = req.body.refreshToken;
        let password = req.body.password;
        if ((provider == null || providerToken == null) && password==null){
            send_error.bad_request(res);
            console.log(provider + "-" + providerToken + " - " +util.inspect(req.body, false, null, true /* enable colors */))
            return;
        }
        update = {};
        if(provider != null){
            update.provider = provider;
            update.providerToken = providerToken;
            if(refreshToken != null)
                update.refreshToken = refreshToken;
        }
        if(password != null){
            update.password = password;
        }
        db.User.update(update, {where:{id:jwt.get_token_payload(req).id}})
        .then((result)=>{
            if (result != null){
                console.log("Update user: " + result);
                res.status(204)
                res.send();
            }else{
                send_error.internal_error(res);
            }
        }).catch((err)=>{
            console.log(err);
            send_error.internal_error(res);
        })
        
    });
}

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    return payload;
}

function createUser(email,password,db,res){
    db.User.create({
        email: email,
        password: password
    })
    .then((result) => {
        // CREATE TOKEN
        let apiToken = jwt.create_token(result.id);
        result.apiToken = apiToken;
        result.save().then((result)=>{ 
            res.send(result);
            console.log("Token added to user");
        });
    })
    .catch((err) => {
        console.log(err);
        send_error.existing_user(res);
    })
}
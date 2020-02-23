/* API for the TOKEN object */
//TODO: manage the expiration of the tokens
const checkToken = require("../middlewares/checkToken");
const send_error = require("../../modules/send_error");
 
module.exports = (app, db) => {
    /* Get NoteSync token, required for API operations
    Parameters:
        - email: email of the user associated to the required token
        - password: pass of the user associated to the given email
    Return: error or JSON object containing the 'token' field.
    */
    app.get( "/API/token", (req, res) =>{
        //TODO: implement crypto
        let email = req.query.email;
        let password = req.query.password;
        console.log("req:"+req.query);
        let user = null;
        db.User.findByPk(email).then((result)=>{
            user=result;
            if(user.password == password){
                console.log("login correct");
                // Retrieve token
                db.Token.findOne({ where: { provider: 0,owner: email} }).then((result)=>{
                    let token = result.jwt;
                    console.log("Token:"+token);
                    // SEND BACK TOKEN
                    res.send('{"token":"'+token+'"}');
                }).catch((err)=>{
                    console.log("ERR:"+err);
                    send_error(res,"Invalid credentials",200);
                });
            }else{
                console.log("login unseccsefful");
                send_error(res,"Invalid credentials",200);
            }
        }).catch((err)=>{
            console.log("ERR:"+err);
            send_error(res,"Invalid credentials",200);
        });
    });

    /* Get Evernote or Onenote token
    Query:
        - provider: either 1 or 2, where 1 = Onenote and 2 = Evernote.
    Parameters:
        - email: email of the user associated to the required token
    Return: error or JSON object containing the 'token' field.
    */
    app.get( "/API/token/:provider", checkToken,(req, res) =>{
        let provider = req.params.provider;
        let email = req.query.email;

        // Retrieve token
        db.Token.findOne({ where: {provider: provider,owner: email} }).then((result)=>{
            let token = result.jwt;
            console.log("Token:"+token);
            // SEND BACK TOKEN
            res.send('{"token":"'+token+'"}');
        }).catch((err)=>{
            console.log("ERR:"+err);
            send_error(res,"User has no such token",200);
        });
            
    });

  
    /* Create new token
    Parameters:
        - JWT token of NoteSync in the Authorization header
        - provider: integer representing the provider for which the token is created
        - token: JWT token provided by Evernote or OneNote
        - email: email of the user associated to the token (must correspond the the one in the NoteSync JWT token)
    Return: error or a message of successful creation
    */
    app.post("/API/token", checkToken, (req, res) => {
        let provider = parseInt(req.body.provider);
        if(provider < 1 || provider > 2)
            return;
        let token = req.body.token;
        let email = req.body.email;
        console.log("provider:" + provider);
        db.Token.create({
            jwt: token,
            owner: email,
            provider: provider,
        }).then((result) => {
            console.log(result);
            res.status(200);
            res.send('{"msg":"Token correctly created"}');
        }).catch((err) => {
            console.log(err);
            send_error(res,"There was an error creating the token",500);
        });
    });
}


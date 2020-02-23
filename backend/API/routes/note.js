/* API for the USER object */
//TODO: check if the owner is authenticated
const checkToken = require("../middlewares/checkToken");
const https = require("https");
module.exports = (app, db) => {
    
    //Get all of the notes of a user
    //TODO: implement method
    app.get( "/API/notes/:user", checkToken,(req, res) =>{
        let userNotes;
        let sharedNotes;
        db.Note.findAll({
            where: {
                owner: req.query.user
            }
        }).then((result) => {
            userNotes = result;
            db.Note.findAll({
                where: {
                    shared: req.query.user
                }
            }).then((result) => {
                sharedNotes = result;
                console.log("User:\n"+userNotes+"\nShared"+sharedNotes);
                //TODO: send notes
            });
        });
    });
    
    //Get note
    //TODO: implement
    app.get( "/API/note/:id/", checkToken,(req, res) =>{
        let userNotes;
        let sharedNotes;
        db.Note.findAll().then( (result) => res.json(result) )
    });

    /*Get notes from onenote
    Parameters: token
    */
    app.get("/API/note/onenote",checkToken,(req,res)=>{
        let email = req.params.email;
        db.Token.findOne({ where: { provider: 1,owner: email} }).then((result)=>{
            let token = result.jwt;
            let payload = "email="+encodeURI(req.session.email)+""
        
            let options = {
                host:"graph.microsoft.com",
                path:"/v1.0/me/onenote/notes/pages"
            }
            const request = https.request(options, incoming => {
                console.log(`statusCode: ${incoming.statusCode}`);
                incoming.on('data', function (chunk) {
                    console.log('BODY: ' + chunk);
                });
            })
        }).catch((err)=>{
            console.log("ERR:"+err);
            send_error(res,"The account is not linked to Onenote",401);
        });
    });

    //Create new note
    app.post("/API/note",checkToken, (req, res) => {
        db.Note.create({
            title: req.body.title,
            content: req.body.content,
            owner: req.body.email
            
        })
        .then((result) => {
            res.send(result)})
        .catch((err) => {
            console.log(err);
            res.send('{"error":"There was an error creating the note"}');
        })
    });
    

}


/* API for the USER object */
//TODO: check if the owner is authenticated
const checkToken = require("../middlewares/checkToken");
module.exports = (app, db) => {
    //Get note
    app.get( "/API/note", checkToken,(req, res) =>
        db.Note.findAll().then( (result) => res.json(result) )
    );

    app.get( "/note/:email",checkToken, (req, res) =>
        db.Note.findByPk(req.params.email).then( (result) => res.json(result))
    );
  
    //Create new note
    app.post("/API/note",checkToken, (req, res) => {
        db.Note.create({
            title: req.body.title,
            content: req.body.content,
            owner: req.body.owner
        })
        .then((result) => {
            res.send(result)})
        .catch((err) => {
            console.log(err);
            res.send('{"error":"There was an error creating the note"}');
        })
    });
}


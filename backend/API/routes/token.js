/* API for the TOKEN object */
//TODO: check if the owner is authenticated
module.exports = (app, db) => {
    //Get token
    app.get( "/API/token", (req, res) =>
        db.Note.findAll().then( (result) => res.json(result) )
    );

    app.get( "/token/:email", (req, res) =>
        db.Note.findByPk(req.params.email).then( (result) => res.json(result))
    );
  
    //Create new token
    app.post("/API/token", (req, res) => {
        db.Token.create({
            title: req.body.title,
            content: req.body.content,
            owner: req.body.owner,
        })
        .then((result) => {
            res.send(result)})
        .catch((err) => {
            console.log(err);
            res.send('{"error":"There was an error creating the token"}');
        })
    });
}


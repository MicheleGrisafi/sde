/* API for the USER object */
//TODO: use page limits
const checkToken = require("../middlewares/checkToken");
const jwt = require("../../modules/token");
const send_error = require("../../modules/send_error");
const { QueryTypes } = require('sequelize');

module.exports = (app, db) => {
    
    //Get all of the notes of a user
    app.get( "/API/users/:userId/notes", checkToken,(req, res) =>{
        if (jwt.get_token_payload(req).id != req.params.userId){
            console.log("UserId query different from id in token. Id: " + req.params.userId + " while token " + jwt.get_token_payload(req).id);
            send_error.unauthorized(res);
            return;
        }
        db.sequelize.query("SELECT id, title FROM notes WHERE ownerId = :userId", {replacements: { userId: req.params.userId}, type: QueryTypes.SELECT })
        .then((result)=>{
            res.send(result);
        })
        .catch((err)=>{
            console.log(err);
            send_error.internal_error(res);
        });
    });

    app.get( "/API/users/:userId/notes/shared", checkToken,(req, res) =>{
        if (jwt.get_token_payload(req).id != req.params.userId){
            send_error.unauthorized(res);
            return;
        }
        db.sequelize.query("SELECT n.id, n.title FROM notes as n,noteShares as s WHERE s.userId = :userId AND s.noteId = n.id", {replacements: { userId: req.params.userId}, type: QueryTypes.SELECT })
        .then((result)=>{
            //TODO: test this method
            res.send(result);
        })
        .catch((err)=>{
            console.log(err);
            send_error.internal_error(res);
        });
    });
    
    //Create note
    app.post("/API/users/:userId/notes",checkToken, (req, res) => {
        if (jwt.get_token_payload(req).id != req.params.userId){
            send_error.unauthorized(res);
            return;
        }
        let title = req.body.title;
        let content = req.body.content;
        let ownerId = req.params.userId;
        createNote(title,content,ownerId,res,db);
    });
    app.post("/API/notes",checkToken, (req, res) => {
        let title = req.body.title;
        let content = req.body.content;
        let ownerId = req.body.ownerId;
        let tokenId = jwt.get_token_payload(req).id;
        const util = require('util')

        console.log("Req body:" + util.inspect(req.body, {showHidden: false, depth: null}))

        if (ownerId != null && tokenId != ownerId){
            console.log("Token Id: " + tokenId + " while id is "+ ownerId);
            send_error.unauthorized(res);   
            return;
        }
        createNote(title,content,ownerId,res,db);
    });

    
    //Get single note
    //TODO: test
    app.get( "/API/notes/:noteId", checkToken,(req, res) =>{
        let noteId = req.params.noteId;
        let ownerId = jwt.get_token_payload(req).id;
        db.sequelize.query("SELECT n.id, n.title, n.content, n.ownerId FROM notes n, noteShares s WHERE (n.id = :noteId AND n.ownerId = :ownerId) OR (n.id = s.noteId AND s.userId = :ownerId)", {replacements: { ownerId: ownerId, noteId: noteId}, type: QueryTypes.SELECT })
        .then((result)=>{
            if(result != null){
                console.log("Note:" + result);
                res.send(result[0]);
            }else{
                send_error.unauthorized(res);
            }
        })
        .catch((err)=>{
            console.log(err);
            send_error.internal_error(res);
        });
        
    });

    

    app.put( "/API/notes/:noteId", checkToken,(req, res) =>{
        console.log(req.body);
        let noteId = req.params.noteId;
        let userId = jwt.get_token_payload(req).id;
        let title = req.body.title;
        let content = req.body.content;

        if(title == null || content == null){
            send_error.bad_request(res);
        }

        db.sequelize.query(
            "UPDATE notes as n JOIN noteShares as s ON n.id = :noteId AND (n.ownerId = :ownerId OR (n.id = s.noteId AND s.userId = :ownerId)) SET n.title = :title, n.content = :content", 
            {replacements: { ownerId: userId, noteId:noteId,title:title,content:content}, type: QueryTypes.UPDATE })
        .then((result)=>{
            //TODO: test this method
            console.log(result);
            if (result[1] == 1){ //second elemtn of the list...
                console.log("Note Modified");
                db.Note.findByPk(noteId).then((result)=>{
                    console.log("Modified note: "+result);
                    if(result != null){
                        res.send(result);
                    }else{
                        send_error.internal_error(res);
                    }
                }).catch((err)=>{
                    console.log(err);
                    send_error.internal_error(res);
                });
            }else{
                send_error.unauthorized(res);
            }
        })
        .catch((err)=>{
            console.log(err);
            send_error.internal_error(res);
        });

        
    });
    app.delete( "/API/notes/:noteId", checkToken,(req, res) =>{
        db.Note.destroy({where:{
            id:req.params.noteId, 
            ownerId: jwt.get_token_payload(req).id
        }})
        .then( (result) => {
            if(result==1){
                res.status(204);
                res.send();
            }else{
                send_error.unauthorized(res);
            }
        })
        .catch((err)=>{
            console.log(err);
            send_error.unauthorized(req);
        })
    });

    app.post("/API/notes/:noteId/shares",checkToken, (req, res) => {
        let userEmail = req.body.userEmail;
        let noteId = req.body.noteId;
        if (userEmail == null || noteId == null || noteId != req.params.noteId){
            console.log(req.body);
            send_error.bad_request(res);
            return;
        }
        let ownerId = jwt.get_token_payload(req).id;
        db.Note.findOne(
            {where:{id:noteId, ownerId: ownerId}
        }).then((result)=>{
            if(result != null){
                db.User.findOne({where:{email:userEmail}}).then((result)=>{
                    if (result != null){
                        db.NoteShare.create({
                            noteId: noteId,
                            userId: result.id
                        }).then((result)=>{
                            res.send(result);
                        }).catch((err)=>{
                            console.log(err);
                            send_error.internal_error(res);
                        });
                    }else{
                        send_error.nonExistingUser(res);
                    }
                }).catch((err)=>{
                    console.log(err);
                    send_error.internal_error(res);
                });
            }else{
                send_error.unauthorized(res);
            }
        }).catch((err)=>{
            console.log(err);
            send_error.internal_error(res);
        });
    });
    app.delete("/API/notes/:noteId/shares/:shareId",checkToken, (req, res) => {
        let ownerId = jwt.get_token_payload(req).id;
        
        //It's either owned by the user or shared with him
        //TODO: implement!
        db.Note.findOne(
            {where:{id:req.params.noteId, ownerId: ownerId}
        }).then(()=>{
            db.NoteShare.destroy({where:{
                id: req.params.shareId
            }}).then(()=>{
                res.status(204);
                res.send();
            }).catch((err)=>{
                console.log(err);
                send_error.internal_error(res);
            });
        }).catch((err)=>{
            console.log(err);
            send_error.unauthorized(res);
        });
    });

    app.post("/API/notes/:noteId/links",checkToken, (req, res) => {
        let externalId = req.body.externalId;
        let provider = req.body.provider;
        if (provider == null || externalId == null){
            send_error.bad_request(res);
            return;
        }
        let ownerId = jwt.get_token_payload(req).id;
        db.Note.findOne(
            {where:{id:req.params.noteId, ownerId: ownerId}
        }).then(()=>{
            db.NoteLink.create({
                noteId: req.params.noteId,
                userId: ownerId,
                externalId: externalId,
                provider: provider,
            }).then((result)=>{
                res.send(result);
            }).catch((err)=>{
                console.log(err);
                send_error.internal_error(res);
            });
        }).catch((err)=>{
            console.log(err);
            send_error.unauthorized(res);
        });
    });
    app.delete("/API/notes/:noteId/links/:linkId",checkToken, (req, res) => {
        let ownerId = jwt.get_token_payload(req).id;
        
        db.NoteShare.destroy({where:{
            id: req.params.shareId,
            userId: ownerId
        }}).then(()=>{
            res.status(204);
            res.send();
        }).catch((err)=>{
            console.log(err);
            send_error.unauthorized(res);
        });
        
    });


}

function createNote(title,content,ownerId,res,db){
    if(title == null || content == null || ownerId == null){
        send_error.bad_request(res);
        return;
    }
    db.Note.create({
        title: title,
        content: content,
        ownerId: ownerId
    }).then((result) => {
        res.send(result);
    }).catch((err) => {
        console.log(err);
        send_error.internal_error(res);
    })
}
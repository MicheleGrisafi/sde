/* API for the USER object */
//TODO: use page limits
const checkToken = require("../middlewares/checkToken");
const jwt = require("../../modules/token");
const send_error = require("../../modules/send_error");
const { QueryTypes } = require('sequelize');
const util = require('util')

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
        db.sequelize.query("SELECT n.id, n.title, s.id as shareId FROM notes as n,noteShares as s WHERE s.userId = :userId AND s.noteId = n.id", {replacements: { userId: req.params.userId}, type: QueryTypes.SELECT })
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
        console.log("POST /API/users/id/notes. Creating note");
        if (jwt.get_token_payload(req).id != req.params.userId){
            send_error.unauthorized(res);
            return;
        }
        let title = req.body.title;
        let content = req.body.content;
        let ownerId = req.params.userId;
        let lastUpdated = req.body.lastUpdated;

        console.log("Req body:" + util.inspect(req.body, {showHidden: false, depth: null}))


        createNote(title,content,ownerId,lastUpdated,res,db);
    });
    app.post("/API/notes",checkToken, (req, res) => {
        let title = req.body.title;
        let content = req.body.content;
        let ownerId = req.body.ownerId;
        let lastUpdated = req.body.lastUpdated; 
        let tokenId = jwt.get_token_payload(req).id;
        const util = require('util')

        console.log("Req body:" + util.inspect(req.body, {showHidden: false, depth: null}))

        if (ownerId != null && tokenId != ownerId){
            console.log("Token Id: " + tokenId + " while id is "+ ownerId);
            send_error.unauthorized(res);   
            return;
        }
        createNote(title,content,ownerId,lastUpdated,res,db);
    });

    
    //Get single note
    //TODO: test
    app.get( "/API/notes/:noteId", checkToken,(req, res) =>{
        let noteId = req.params.noteId;
        let ownerId = jwt.get_token_payload(req).id;
        db.sequelize.query("SELECT id, title, content, ownerId, lastUpdated FROM notes WHERE (id = :noteId AND ownerId = :ownerId) OR id IN (SELECT noteId FROM noteShares WHERE userId = :ownerId)", {replacements: { ownerId: ownerId, noteId: noteId}, type: QueryTypes.SELECT })
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
        let lastUpdated = req.body.lastUpdated;

        if(title == null || content == null || lastUpdated == null){
            send_error.bad_request(res);
        }

        db.sequelize.query(
            "UPDATE notes SET title = :title, content = :content, lastUpdated = :lastUpdated WHERE (id = :noteId AND ownerId = :ownerId) OR id IN (SELECT noteId FROM noteShares WHERE userId = :ownerId)", 
            {replacements: { ownerId: userId, noteId:noteId,title:title,content:content, lastUpdated:lastUpdated}, type: QueryTypes.UPDATE })
        .then((result)=>{
            //TODO: test this method
            console.log("Result ="+result);
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

    //TODO: delete link
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
        let userId = jwt.get_token_payload(req).id;
        let shareId = req.params.shareId;
        console.log("ShareId = "+shareId);
        
        db.NoteShare.destroy({where:{
            id: shareId,
            userId: userId
        }}).then(()=>{
            res.status(204);
            res.send();
        }).catch((err)=>{
            console.log(err);
            send_error.internal_error(res);
        });
    });

    app.post("/API/notes/:noteId/links",checkToken, (req, res) => {
        let externalId = req.body.noteExternalId;
        let provider = req.body.provider;
        console.log("Body: " + util.inspect(req.body, {showHidden: false, depth: null}));
        if (provider == null || externalId == null){
            send_error.bad_request(res);
            console.log("Provider or external id are missing. Aborting");
            return;
        }
        let ownerId = jwt.get_token_payload(req).id;
        if(req.body.userId != ownerId){
            send_error.unauthorized(res);
            console.log("Unauthroized access");
            return; 
        }
        console.log("Create link");
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
            send_error.internal_error(res);
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

function createNote(title,content,ownerId,lastUpdated,res,db){
    if(title == null || content == null || ownerId == null){
        send_error.bad_request(res);
        return;
    }
    if(lastUpdated == null) lastUpdated = 0;
    db.Note.create({
        title: title,
        content: content,
        ownerId: ownerId,
        lastUpdated: lastUpdated
    }).then((result) => {
        res.send(result);
    }).catch((err) => {
        console.log(err);
        send_error.internal_error(res);
    })
}
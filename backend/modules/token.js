const jwt = require('jsonwebtoken');
const fs = require('fs');
const publicKey = fs.readFileSync(__dirname+'/../crypto/sde.key.pub');
const privateKey = fs.readFileSync(__dirname+'/../crypto/sde.key');

const ISSUER = "localhost";
const JWT_LIFE_SPAN = 60*60*24*365; //1 year

module.exports = {
    decode_access_token: function(access_token){
        try {
            var decoded = jwt.verify(access_token, publicKey,{ algorithms: ['RS256']});
        }catch(err) {
            console.log("There was an error: " + err);
            return null;
        }
        return decoded;
    },
    extract_token: function(req){
        //console.log("Request: " + req);
        let auth_header = req.header('Authorization');
        if(auth_header == null || auth_header.search("Bearer") < 0){
            return null;
        }
        return auth_header.substr(7,auth_header.len);
    },
    get_token_payload: function(req){
        return this.decode_access_token(this.extract_token(req));
    },
    create_token: function create_token(userId){
        var dt = new Date();
        let payload = {
            "iss": ISSUER,
            "exp": dt.getTime() + JWT_LIFE_SPAN,
            "id":userId
        }
        let token = jwt.sign(payload,privateKey,{ algorithm: 'RS256'});
        return token;
    }

}
module.exports = function (res,msg,code){
    res.status(code);
    res.send('{"error":"'+msg+'"}');
}
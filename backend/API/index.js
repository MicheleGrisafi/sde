const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const APIroutes = {};
const APImiddlewares = {};
const routesDir = __dirname+"/routes"
const middleDir = __dirname+"/middlewares"

fs
.readdirSync(routesDir)
.filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
})
.forEach(file => {
    let route = require(path.join(routesDir, file));
    APIroutes[file.slice(0, -3)] = route;
});

fs
.readdirSync(middleDir)
.filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
})
.forEach(file => {
    let middle = require(path.join(middleDir, file));
    APImiddlewares[file.slice(0, -3)] = middle;
});


module.exports = {APIroutes,APImiddlewares};





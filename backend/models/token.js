const User = require("./user");
module.exports = (sequelize, type) => {
    return sequelize.define('Token', {
        provider: {
            type: type.SMALLINT,
            allowNull: false,
            primaryKey: true
        },
        jsonToken: {
            type: type.JSON,
            allowNull: false
        },
        owner:{
            type: type.STRING,
            allowNull: false,
            primaryKey: true,
            references: {model: User,key: 'email'}
        }}, {tableName: 'tokens',timestamps: false}
    )
}
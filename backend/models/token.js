const User = require("./user");
module.exports = (sequelize, type) => {
    return sequelize.define('Token', {
        provider: {
            type: type.SMALLINT,
            allowNull: false,
            primaryKey: true
        },
        jwt: {
            type: type.TEXT,
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
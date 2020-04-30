
const User = require("./user.js")
module.exports = (sequelize, type) => {
    return sequelize.define('Note', {
        id: {
            type: type.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        title: {
            type: type.STRING,
            allowNull: false
        },
        content: {
            type: type.STRING,
        },
        ownerId:{
            type: type.INTEGER,
            allowNull: false,
            references: {model: User,key: 'id'}
        },lastUpdated: {
            type: type.INTEGER
        }}, {tableName: 'notes',timestamps: false}
    )
}
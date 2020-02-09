
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
        owner:{
            type: type.STRING,
            allowNull: false,
            references: {model: User,key: 'email'}
        },
        shared:{
            type: type.STRING,
            defaultValue: null,
            references: {model: User,key: 'email'}
        },
        status:{
            type: type.SMALLINT,
            allowNull: false,
            defaultValue: 0
        }}, {tableName: 'notes',timestamps: false}
    )
}
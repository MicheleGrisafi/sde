
const User = require("./user.js");
const Note = require("./note.js");
module.exports = (sequelize, type) => {
    return sequelize.define('NoteLink', {
        provider: {
            type: type.SMALLINT,
            allowNull: false,
            primaryKey: true
        },
        owner:{
            type: type.STRING,
            allowNull: false,
            references: {model: User,key: 'email'},
            primaryKey: true
        },
        note:{
            type: type.INTEGER,
            allowNull: false,
            references: {model: Note,key: 'id'}
        }}, {tableName: 'noteLinks',timestamps: false}
    )
}
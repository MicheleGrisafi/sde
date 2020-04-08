
const User = require("./user.js");
const Note = require("./note.js");
module.exports = (sequelize, type) => {
    return sequelize.define('NoteLink', {
        id: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        provider: {
            type: type.SMALLINT,
            allowNull: false,
        },
        userId:{
            type: type.INTEGER,
            allowNull: false,
            references: {model: User,key: 'id'},
        },
        noteId:{
            type: type.INTEGER,
            allowNull: false,
            references: {model: Note,key: 'id'}
        },
        externalId:{
            type: type.INTEGER,
            allowNull: false
        }}, {tableName: 'noteLinks',timestamps: false}
    )
}

const User = require("./user.js");
const Note = require("./note.js");

module.exports = (sequelize, type) => {
    return sequelize.define('NoteShare', {
        id: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        noteId: {
            type: type.INTEGER,
            allowNull: false,
            references: {model: Note,key: 'id'}
        },
        userId:{
            type: type.INTEGER,
            allowNull: false,
            references: {model: User,key: 'id'}
        }}, {tableName: 'noteShares',timestamps: false}
    )
}
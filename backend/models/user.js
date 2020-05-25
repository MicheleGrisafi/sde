module.exports = (sequelize, type) => {
    const User = sequelize.define('User', {
        id: {
            type: type.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type: type.STRING,
            allowNull: false,
        },
        password: {
            type: type.STRING
        },
        apiToken:{
            type: type.TEXT,
        },
        providerToken:{
            type: type.TEXT,
            default: null
        },
        refreshToken:{
            type: type.TEXT,
            default: null
        },
        provider:{
            type: type.BOOLEAN,
            default: null
        }
    }, {tableName: 'users',timestamps: false})
    return User;
}
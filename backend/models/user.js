module.exports = (sequelize, type) => {
    const User = sequelize.define('User', {
        email: {
            type: type.STRING,
            allowNull: false,
            primaryKey: true
        },
        password: {
            type: type.STRING
        }}, {tableName: 'users',timestamps: false}
    )
    return User;
}
var connection = require('../mysql/connection');
var bcrypt = require('bcrypt-nodejs');

function User() {
}
(function () {
    this.create = function (user, res) {
        connection.acquire(function (err, con) {
            if (err) {
                console.log(err);
                return res.send({ status: 1, message: 'Error al conectarse a la base de datos', error: err });
            }
            bcrypt.genSalt(5, function (err, salt) {
                if (err) {
                    console.log(err);
                    return res.send({ status: 1, message: 'Error al crear el usuario', error: err });
                }
                bcrypt.hash(user.password, salt, null, function (err, hash) {
                    if (err) {
                        console.log(err);
                        return res.send({ status: 1, message: 'Error al codificar la contraseña del usuario', error: err });
                    }
                    user.password = hash;
                    con.query("INSERT INTO USER SET ?", user, function (err, result) {
                        if (err) {
                            console.log(err);
                            return res.send({ status: 1, message: 'Error al crear el usuario', error: err });
                        }
                        return res.send({ status: 0, message: 'El usuario fue creado correctamente' });
                    });
                });
            });
        });
    }
    this.validate = function (username, password, callback) {
        connection.acquire(function (err, con) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            con.query("SELECT U.username, U.password FROM USER U WHERE U.username = ?", username, function (err, result) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }
                if (result && result.length > 0) {
                    var user = result[0];
                    bcrypt.compare(password, user.password, function (err, isMatch) {
                        if (err) return callback(err);
                        callback(null, user);
                    });
                }
                callback(null, false);
            });
        });
    }
    this.getUserById = function (userId, callback) {
        connection.acquire(function (err, con) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            con.query("SELECT U.username, U.password FROM USER U WHERE U.id = ?", userId, function (err, result) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }
                if (result && result.length > 0) {
                    var user = result[0];
                    callback(null, user);
                }
                callback(null, null);
            });
        });
    }
}).call(User.prototype);

module.exports = new User();
var connection = require('../mysql/connection');
var bcrypt = require('bcrypt-nodejs');

function User() {
}
(function () {
    this.create = function (client, res) {
        connection.acquire(function (err, con) {
            if (err) {
                console.log(err);
                return res.send({ status: 1, message: 'Error al conectarse a la base de datos', error: err });
            }
            bcrypt.genSalt(5, function (err, salt) {
                if (err) {
                    console.log(err);
                    return res.send({ status: 1, message: 'Error al crear el cliente', error: err });
                }
                bcrypt.hash(client.password, salt, null, function (err, hash) {
                    if (err) {
                        console.log(err);
                        return res.send({ status: 1, message: 'Error al codificar la contraseña del cliente', error: err });
                    }
                    client.secret = hash;
                    con.query("INSERT INTO oauth_clients SET ?", client, function (err, result) {
                        if (err) {
                            console.log(err);
                            return res.send({ status: 1, message: 'Error al crear el usuario', error: err });
                        }
                        return res.send({ status: 0, message: 'El cliente fue creado correctamente' });
                    });
                });
            });
        });
    }
    this.validate = function (clientId, clientSecret, callback) {
        connection.acquire(function (err, con) {
            if (err) {
                console.log(err);
                return callback(err);
            }
            con.query("SELECT name, id, secret, userId FROM oauth_clients WHERE id = ?", clientId, function (err, result) {
                if (err) {
                    console.log(err);
                    return callback(err);
                }
                if (result && result.length > 0) {
                    var client = result[0];
                    bcrypt.compare(clientSecret, client.secret, function (err, isMatch) {
                        if (err) return callback(err);
                        callback(null, client);
                    });
                }
                callback(null, false);
            });
        });
    }
}).call(User.prototype);

module.exports = new User();
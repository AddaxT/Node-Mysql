var oauth2orize = require('oauth2orize');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy
var moment = require('moment');
var user = require('../user/model');
var client = require('../client/model');

var server = oauth2orize.createServer();

function executeQuery(methodName, query, parameters, successCallback, errorCallback) {
    return new Promise(function (resolve, reject) {
        connection.acquire(function (err, con) {
            if (err) {
                console.log('Error connection to DB', err);
                reject(err);
            } else {
                con.query(query, parameters, function (err, result) {
                    con.release();
                    if (err) {
                        console.log('Error executing query to the database', err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            }
        });
    }).then(successCallback).catch(errorCallback);
}

function UUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

server.serializeClient(function (client, callback) {
    return callback(null, client._id);
});

server.deserializeClient(function (id, callback) {
    executeQuery(
        'deserializeClient',
        'SELECT id, name, secret, userId FROM oauth_clients WHERE id = ?',
        id,
        function (result) {
            var oAuthClient = result[0];
            if (!oAuthClient) {
                return;
            }
            return callback(null, oAuthClient);
        }, callback);
});

server.grant(oauth2orize.grant.code(function (client, redirectUri, user, ares, callback) {
    executeQuery(
        'grant',
        'INSERT INTO oauth_authorization_codes(value, redirectUri, userId, clientId) VALUES (?, ?, ?, ?)',
        [
            UUID(),
            redirectUri,
            user._id,
            client._id,
        ],
        function (result) {
            return callback(null, code.value);
        }, callback);
}));

server.exchange(oauth2orize.exchange.code(function (client, code, redirectUri, callback) {
    executeQuery(
        'grant query',
        'SELECT value, clientId, userId, redirectUri FROM oauth_authorization_codes WHERE value = ?',
        code,
        function (result) {
            if (!result || !result.length) {
                return callback(null, false);
            }
            var authCode = result[0];
            if (client._id.toString() !== authCode.clientId) { return callback(null, false); }
            if (redirectUri !== authCode.redirectUri) { return callback(null, false); }

            executeQuery(
                'grant remove',
                'DELETE FROM oauth_authorization_codes WHERE value = ?',
                code,
                function (result) {
                    var tokenPayload = {
                        value: UUID(),
                        clientId: client._id,
                        userId: authCode.user_id
                    };
                    return executeQuery(
                        'grant token',
                        'INSERT INTO oauth_tokens(value, expires_on, clientId, userId) VALUES (?, ?, ?, ?)',
                        [
                            tokenPayload.value,
                            moment().add(1, 'day'),
                            tokenPayload.clientId,
                            tokenPayload.userId
                        ],
                        function (result) {
                            return callback(null, tokenPayload);
                        });
                },
                errorCallback);
        }, callback);
}));

passport.use(new BasicStrategy(function (username, password, callback) { user.validate(username, password, callback) }));

passport.use('client-basic', new BasicStrategy(function (clientId, clientSecret, callback) { client.validate(clientId, clientSecret, callback) }));

passport.use(new BearerStrategy(
    function (accessToken, callback) {
        executeQuery(
            'findToken',
            'SELECT value, expires_on, clientId, userId FROM oauth_tokens WHERE value = ?',
            accessToken,
            function (result) {
                if (!result && !result.length) {
                    return callback(null, false);
                }
                var oAuthToken = result[0];
                user.getUserById(token.userId, function (err, user) {
                    if (err) { return callback(err); }
                    if (!user) { return callback(null, false); }
                    callback(null, user, { scope: '*' });
                });
            }, callback);
    }
));

module.exports.authorization = [
    server.authorization(function (clientId, redirectUri, callback) {
        executeQuery(
            'authorization',
            'SELECT id, name, secret FROM oauth_clients WHERE id = ?',
            id,
            function (result) {
                var oAuthClient = result[0];
                if (!oAuthClient) {
                    return;
                }
                return callback(null, client, redirectUri);
            }, callback);
    })
]

module.exports.decision = [
    server.decision()
]

module.exports.token = [
    server.token(),
    server.errorHandler()
]

module.exports.isAuthenticated = passport.authenticate(['basic', 'bearer'], { session: false });
module.exports.isClientAuthenticated = passport.authenticate('client-basic', { session: false });
module.exports.isBearerAuthenticated = passport.authenticate('bearer', { session: false });
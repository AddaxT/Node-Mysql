var oauth2orize = require('oauth2orize');
var moment = require('moment');

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
        'SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE client_id = ?',
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
    var code = new Code({
        value: UUID(),
        clientId: client._id,
        redirectUri: redirectUri,
        userId: user._id
    });
    executeQuery(
        'grant',
        'INSERT INTO oauth_authorization_codes(authorization_code, expires, scope, client_id, user_id, redirect_uri) VALUES (?, ?, ?, ?, ?, ?)',
        [
            code.value,
            moment().add(1, 'day'),
            'ALL',
            code.clientId,
            code.userId,
            redirectUri
        ],
        function (result) {
            return callback(null, code.value);
        }, callback);
}));

server.exchange(oauth2orize.exchange.code(function (client, code, redirectUri, callback) {
    executeQuery(
        'grant query',
        'SELECT authorization_code, expires, scope, client_id, user_id, redirect_uri FROM oauth_authorization_codes WHERE authorization_code = ?',
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
                'DELETE FROM oauth_authorization_codes WHERE authorization_code = ?',
                code,
                function (result) {
                    var tokenPayload = {
                        value: UUID(),
                        clientId: client._id,
                        userId: authCode.user_id
                    };
                    return executeQuery(
                        'grant token',
                        'INSERT INTO oauth_tokens(access_token, access_token_expires_on, client_id, user_id) VALUES (?, ?, ?, ?)',
                        [
                            tokenPayload.value,
                            moment().add(1, 'day'),
                            tokenPayload.clientId,
                            tokenPayload.userId
                        ],
                        function (result) {
                            return callback(null, new Token(tokenPayload));
                        });
                },
                errorCallback);
        }, callback);
}));

module.exports.authorization = [
    server.authorization(function (clientId, redirectUri, callback) {
        executeQuery(
            'authorization',
            'SELECT client_id, client_secret, redirect_uri FROM oauth_clients WHERE client_id = ?',
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
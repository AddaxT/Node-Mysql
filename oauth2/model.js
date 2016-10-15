var connection = require('../mysql/connection');

function OAuthMySQLModel() {
}
(function () {

    function executeQuery(methodName, query, parameters, callback) {
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
        }).then(function (res) { callback(null, res) }).catch(function (err) {
            callback(err)
        });
    }
    this.getAccessToken = function (bearerToken) {
        return executeQuery(
            'getAccessToken',
            'SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE access_token = ?',
            bearerToken,
            function (result) {
                var token = result[0];
                return {
                    accessToken: token.access_token,
                    clientId: token.client_id,
                    expires: token.expires,
                    userId: token.userId
                };
            });
    };

    this.getClient = function (clientId, callback) {
        return executeQuery(
            'getClient',
            'SELECT id, name, secret, userId, redirect_uri FROM oauth_clients WHERE client_id = ? AND client_secret = ?',
            [clientId, clientSecret],
            function (err, res) {
                if (err) { return callback(err); }
                return callback(null, res[0]);
            });
    };

    this.getRefreshToken = function (bearerToken) {
        return executeQuery(
            'getRefreshToken',
            'SELECT access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id FROM oauth_tokens WHERE refresh_token = ?',
            bearerToken,
            function (result) {
                return result.length ? result[0] : false;
            });
    };

    this.getUser = function (username, password) {
        return executeQuery(
            'getUser',
            'SELECT id FROM users WHERE username = ? AND password = ?',
            [username, password],
            function (result) {
                return result.length ? result[0] : false;
            });
    };

    this.saveAccessToken = function (token, client, user) {
        return executeQuery(
            'saveAccessToken',
            'INSERT INTO oauth_tokens(id, access_token, access_token_expires_on, client_id, refresh_token, refresh_token_expires_on, user_id) VALUES (UUID(), ?, ?, ?, ?, ?, ?)',
            [
                token.accessToken,
                token.accessTokenExpiresOn,
                client.id,
                token.refreshToken,
                token.refreshTokenExpiresOn,
                user.id
            ],
            function (result) {
                return result.length ? result[0] : false;
            });
    };

    this.saveAuthorizationCode = function (code, client, user) {
        return executeQuery(
            'saveAuthorizationCode',
            'INSERT INTO oauth_authorization_codes(authorization_code, expires, scope, client_id, user_id) VALUES (?, ?, ?, ?, ?)',
            [
                code.authorizationCode,
                code.expiresAt,
                code.scope,
                client.id,
                user.id
            ],
            function (result) {
                code.code = code.authorizationCode
                return code;
            });
    };
}).call(OAuthMySQLModel.prototype);

module.exports = new OAuthMySQLModel();
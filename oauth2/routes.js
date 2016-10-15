var oauth2Controller = require('./controller');

module.exports = {
    configure: function (app) {
        app.post('/oauth2/authorize', oauth2Controller.isAuthenticated, oauth2Controller.decision);
        app.get('/oauth2/authorize', oauth2Controller.isAuthenticated, oauth2Controller.authorization);
        app.post('/oauth2/token', oauth2Controller.isClientAuthenticated, oauth2Controller.token);
    }
};
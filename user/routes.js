var user = require('./model');

module.exports = {
    configure: function (app) {
        app.post('/user', function (req, res) {
            user.create(req.body, res);
        });
    }
};
var client = require('./model');

module.exports = {
    configure: function (app) {
        app.post('/client', function (req, res) {
            client.create(req.body, res);
        });
    }
};
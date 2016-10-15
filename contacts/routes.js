var oauth2Controller = require('../oauth2/controller');
var contact = require('./model');

module.exports = {
  configure: function (app) {
		app.get('/contacts', oauth2Controller.isAuthenticated, function (req, res) {
			contact.list(res);
    });
		app.get('/contact/:id', oauth2Controller.isAuthenticated, function (req, res) {
			contact.get(req.params.id, res);
    });
		app.post('/contact', oauth2Controller.isAuthenticated, function (req, res) {
			contact.create(req.body, res);
    });
		app.put('/contact', oauth2Controller.isAuthenticated, function (req, res) {
			contact.update(req.body, res);
    });
		app.put('/phone', oauth2Controller.isAuthenticated, function (req, res) {
			contact.updatePhone(req.body, res);
    });
		app.delete('/contact/:id', oauth2Controller.isAuthenticated, function (req, res) {
			contact.delete(req.params.id, res);
    });
		app.delete('/phone/:contactId/:id', oauth2Controller.isAuthenticated, function (req, res) {
			contact.deletePhone(req.params.contactId, req.params.id, res);
    });
  }
};
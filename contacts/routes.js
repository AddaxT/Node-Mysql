var contact = require('./model');

module.exports = {
  configure: function (app) {
		app.get('/contacts', function (req, res) {
			contact.list(res);
    });
		app.get('/contact/:id', function (req, res) {
			contact.get(req.params.id, res);
    });
		app.post('/contact', function (req, res) {
			contact.create(req.body, res);
    });
		app.put('/contact', function (req, res) {
			contact.update(req.body, res);
    });
		app.put('/phone', function (req, res) {
			contact.updatePhone(req.body, res);
    });
		app.delete('/contact/:id', function (req, res) {
			contact.delete(req.params.id, res);
    });
		app.delete('/phone/:contactId/:id', function (req, res) {
			contact.deletePhone(req.params.contactId, req.params.id, res);
    });
  }
};
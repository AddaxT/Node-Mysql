var express = require('express');
var bodyparser = require('body-parser');
var routes = require('./contacts/routes');
var connection = require('./mysql/connection');
var app = express();

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
connection.init();
routes.configure(app);

var server = app.listen(3000, function () {
  console.log('Server listening on port ' + server.address().port);
});
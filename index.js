var express = require('express');
var bodyparser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var routes = require('./contacts/routes');
var connection = require('./mysql/connection');
var oauthRoutes = require('./oauth2/routes');
var clientRoutes = require('./client/routes');
var userRoutes = require('./user/routes');
var app = express();

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
connection.init();
app.use(session({
  secret: 'eV9o7OemlmRJOge',
  saveUninitialized: true,
  resave: true
}));
app.use(passport.initialize());
oauthRoutes.configure(app);
routes.configure(app);
clientRoutes.configure(app);
userRoutes.configure(app);

var server = app.listen(3000, function () {
  console.log('Server listening on port ' + server.address().port);
});
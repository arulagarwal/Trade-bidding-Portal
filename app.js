const express = require('express');
const session = require('express-session')
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const moment = require('moment');
var routes = require('./routes/index');
const app = express();
var paypal = require('paypal-rest-sdk');
//routes
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(cookieParser());
app.use(session({secret: 'qwertyuiop'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', routes);
app.use(express.static('public'));

module.exports = app;

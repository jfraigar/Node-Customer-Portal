console.log('app.js--> start');
var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

console.log('app.js--> var raygun = require(raygun);');
var raygun = require('raygun');
var raygunClient = new raygun.Client().init({ apiKey: '8iA/gZwcXIIvak6Q1/4e4w==' });

console.log('app.js--> ./lib/hbsHelpers');
// register the hanglebars helpers
require('./lib/hbsHelpers');
// connect to salesforce org
require('./lib/connection');

console.log('app.js--> ./routes/index');
//var routes = require('./routes/index');
var routes = require('./routes/index');
//var caseroutes = require('./routes/case');

console.log('app.js-->var app = express();');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

console.log('app.js-->app.get(env)-->' + app.get('env'));
console.log('app.js-->process.env.NODE_ENV-->' + process.env.NODE_ENV);
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressSession({
  name: 'session',
  secret: 'eg[isfd-8yF9-7w2315df{}+Ijsli;;to8',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  httpOnly: true,
  secure: true,
  ephemeral: true,
  rolling: true,
  cookie: { maxAge: 30 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, 'public')));

//ROUTES
//app.use('/', routes);
app.use('/', routes);
//app.use('/case', caseroutes);

//force ssl in production
if (app.get('env') === 'production') {
  app.use(function(req, res, next) {
      var reqType = req.headers["x-forwarded-proto"];
      reqType == 'https' ? next() : res.redirect("https://" + req.headers.host + req.url);
  });
}

// error handlers

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
//process.env.NODE_ENV
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.use(raygunClient.expressHandler);
raygunClient.send('raygun gun gun');

module.exports = app;

console.log('aapp.js--> end');
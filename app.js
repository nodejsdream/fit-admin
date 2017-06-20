var express       = require('express');
var path          = require('path');
var favicon       = require('serve-favicon');
var logger        = require('morgan');
var cookieParser  = require('cookie-parser');
//var cookieSession = require('cookie-session');
var bodyParser    = require('body-parser');
var request       = require('request');

var index         = require('./routes/index');
var users         = require('./routes/users');
var reports       = require('./routes/reports');
var config        = require('./config');

var app = express();

const session = require('express-session');
const MongoStore = require('connect-mongo')(session);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*app.use(cookieSession({
    secret: config.sessionSecret,
    cookie: {
        maxAge: config.maxAge
    }
}));*/
app.use(session({
    secret: 'password',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ url: config.mongo })
}));

app.use(function(req, res, next){
  res.locals._GET = function (uri, params, next){
    return request({
        'auth': {
            'bearer': req.session.access_token
          },
        uri: config.apiUrl + config.serverPath + uri,
        method: 'GET'
      }, function (err, rest, body) {
        if (!!err) {
          console.log(e);
          return next(err, null);
        }
        return next(null, body);
      });
  };
  res.locals._POST = function (uri, params, next){
    return request({
        'auth': {
            'bearer': req.session.access_token
          },
        uri: config.apiUrl + config.serverPath + uri,
        form: params,
        method: 'POST'
      }, function (err, rest, body) {
        if (!!err) {
          console.log(e);
          return next(err, null);
        }
        return next(null, body);
      });
  };
  next();
});


app.use('/', index);
app.use('/users', users);
app.use('/reports', reports);
app.all('*',function(req,res,next){
    if((!req.session.logined || !req.session.access_token)&& req.path!="/login"){
        return res.redirect("/login");
    }else{
        next();
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});





module.exports = app;

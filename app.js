var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var lessMiddleware = require('less-middleware');
var logger = require('morgan');
//////
const { Server } = require("socket.io");
var io;
var config = require('./config.json')
var session = require('express-session');
var knex = require('knex')({
  client: 'pg',
  version: '7.2',
  connection:config.pgConnection,
  pool: { min: 0, max: 40 }
});
const pgSession = require('connect-pg-simple')(session);
const pgStoreConfig = {conObject: config.pgConnection}
var sess={
  secret: (config.sha256Secret),
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 10 * 24 * 60 * 60 * 1000,
    // secure: true,
    //httpOnly: true,
    //sameSite: 'none',
  }, // 10 days
  store:new pgSession(pgStoreConfig),
};

//////




var indexRouter = require('./routes/index');
var apiRouter = require('./routes/apiRouter');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

//////////
app.use(session(sess));
app.use("/", (req,res, next)=>{req.knex=knex;next();});
app.use("/", (req,res, next)=>{req.io=io;next();});

//////////

app.use('/api/v1/', apiRouter);
app.use('/', indexRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
app.onListen=function(server){
  io=new Server(server);
  io.on('connection', (socket) => {
    console.log('a user connected');
  });
}




module.exports = app;

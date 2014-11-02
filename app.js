'use strict';

var express =         require('express'), 
    http =            require('http'), 
    passport =        require('passport'), 
    path =            require('path'), 
    morgan =          require('morgan'), 
    bodyParser =      require('body-parser'), 
    methodOverride =  require('method-override'), 
    cookieParser =    require('cookie-parser'), 
    session =         require('express-session'), 
    favicon =         require('serve-favicon'),
    csrf =            require('csurf'),
    dbDriver =        require('./server/dbDriver.js'),
    User =            require('./server/models/User.js'),
    Game =            require('./server/models/Game.js'),
    Scoreboard =      require('./server/models/Scoreboard.js');

var app = module.exports = express();

app.set('views', __dirname + '/client/views');
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/client/favicon.ico'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'client')));
app.use(cookieParser());
app.use(session({ 
    secret: process.env.COOKIE_SECRET || "jUMpAndBumpAndSecREt" , 
    saveUninitialized: true,
    resave: true
}));

var env = process.env.NODE_ENV || 'development';
app.use(csrf());
app.use(function(req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken());
    next();
});
dbDriver.initialize(env);

User.setDb(dbDriver.getDb());
User.loadAllFromDb();

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.localStrategy);
passport.serializeUser(User.serializeUser);
passport.deserializeUser(User.deserializeUser);

Scoreboard.setDb(dbDriver.getDb());
Scoreboard.loadAllInfoFromDb();

require('./server/routes.js')(app);

app.set('port', process.env.PORT || 8811);

var server = http.createServer(app);
Game.initialize(server);

server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

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
    User =            require('./server/models/User.js'),
    Game =            require('./server/models/Game.js');

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
if ('development' === env || 'production' === env) {
    app.use(csrf());
    app.use(function(req, res, next) {
        res.cookie('XSRF-TOKEN', req.csrfToken());
        next();
    });
}

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.localStrategy);
passport.serializeUser(User.serializeUser);
passport.deserializeUser(User.deserializeUser);

require('./server/routes.js')(app);

app.set('port', process.env.PORT || 8811);

var server = http.createServer(app);
Game.initialize(server);
server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

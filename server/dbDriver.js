'use strict';

var config = require('./config/database.json');
var mongo = require('mongoskin');

var db;

module.exports = {
    initialize : function(env) {
        var conf = config[env]||config.dev;
        var dburl = 'mongodb://' + conf.username + ':' + conf.password + '@' + conf.host +':' + conf.port+ '/' + conf.dbname;
        db = mongo.db(dburl, { native_parser: true });
    },
    getDb : function() {
        return db;
    }
};
'use strict';

var Scoreboard = require('../models/Scoreboard.js');

module.exports = {
    getAllUserInfo : function(req, res) {
        res.status(200).send(Scoreboard.getAllUserRecords());
    },
    getAllGameEvents : function(req, res) {
        res.status(200).send(Scoreboard.getAllGameEvents());
    },
    getLifeRecords : function(req, res) {
        res.status(200).send(Scoreboard.getLifeRecords(req.params.name));
    }
};
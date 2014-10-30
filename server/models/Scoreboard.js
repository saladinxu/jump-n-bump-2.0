'use strict';

var _ = require('underscore');

var userRecords = {};
var gameEvents = [];

module.exports = {
    addGameEvent : function(event) {
        gameEvents.push(event);
        initRecordIfNotExist(event.victim);
        initRecordIfNotExist(event.killer);
        
        userRecords[event.victim].lifeRecord.push(_.omit(event, 'victim'));
        userRecords[event.victim].death++;
        userRecords[event.killer].kill++;
        updateBestRecord(event.victim, event.kill, event.end - event.start);
    },
    getUserRecord : function(name) {
        initRecordIfNotExist(name);
        return userRecords[name];
    },
    getAllGameEvents : function() {
        return gameEvents;
    },
    getAllUserRecords : function() {
        return _.map(_.keys(userRecords), function(name) {
            return _.extend({ name : name }, userRecords[name]);
        });
    }
};

function initRecordIfNotExist(name) {
    if (!userRecords.hasOwnProperty(name)) {
        userRecords[name] = {
            kill : 0,
            death : 0,
            bestKill : 0,
            longestLife : 0,
            lifeRecord : []
        };
    }
}

function updateBestRecord(name, kill, lifeLength) {
    if (userRecords[name].bestKill < kill) {
        userRecords[name].bestKill = kill;
    }
    if (userRecords[name].longestLife < lifeLength) {
        userRecords[name].longestLife = lifeLength;
    } 
}
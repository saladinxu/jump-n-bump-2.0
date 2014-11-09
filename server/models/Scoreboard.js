'use strict';

var _ = require('underscore');

var userRecords = {},
    gameEvents = [],
    db;

module.exports = {
    setDb: function(_db) {
        db = _db;
    },
    loadAllInfoFromDb: function() {
        db.bind('userRecords');
        db.userRecords.find().toArray(function(err, results) {
            if (results) {
                _.each(results, function(doc) {
                    userRecords[doc.name] = _.omit(doc, 'name');
                });
            }
        });
        db.bind('gameEvents');
        db.gameEvents.find().toArray(function(err, result) {
            if (result) {
                gameEvents = result;
            }
        });
    },
    addGameEvent : function(event) {
        var killer = event.killer,
            victim = event.victim,
            newEvent = { 
                time : event.end,
                killer : killer,
                victim : victim
            };
        gameEvents.push(newEvent);
        db.gameEvents.insert(newEvent, function() {});

        initRecordIfNotExist(victim);
        initRecordIfNotExist(killer);
        
        userRecords[victim].death++;
        userRecords[killer].kill++;
        if (!userRecords[victim].lifeRecords) {
            userRecords[victim].lifeRecords=[];
        }
        userRecords[victim].lifeRecords.push({
            start: event.start,
            end: event.end,
            length : event.end - event.start,
            killedBy : killer,
            kills : event.kill
        });
        updateBestRecord(victim, event.kill, event.end - event.start);
        
        updateUserInDb(victim);
        updateUserInDb(killer);
    },
    getUserRecord : function(name) {
        initRecordIfNotExist(name);
        return userRecords[name];
    },
    getAllGameEvents : function() {
        return _.map(gameEvents, function(e) {
            return _.omit(e, '_id');
        });
    },
    getAllUserRecords : function() {
        return _.map(_.keys(userRecords), function(name) {
            var record = userRecords[name];
            return {
                name : name,
                win : record.kill,
                lose : record.death,
                longestLife : record.longestLife,
                bestKill : record.bestKill
            };
        });
    },
    getLifeRecords : function(name) {
        return userRecords[name].lifeRecords;
    }
};

function updateUserInDb(name) {
    db.userRecords.update(
        {name:name}, 
        _.extend(userRecords[name], {name:name}), 
        {upsert:true}, 
        function(){}
    );
}

function initRecordIfNotExist(name) {
    if (!userRecords.hasOwnProperty(name)) {
        var newRecord = {
            kill : 0,
            death : 0,
            bestKill : 0,
            longestLife : 0,
            lifeRecords : []
        };
        userRecords[name] = newRecord;
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
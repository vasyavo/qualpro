'use strict';
module.exports = function (PersonnelModel, myId, cb) {
    var _ = require('underscore');
    var aggregation;
    var pipeLine = [];

    pipeLine.push({
        $match: {
            'vacation.cover': myId
        }
    });

    pipeLine.push({
        $group: {
            _id: null,
            ids: {$addToSet: '$_id'}
        }
    });

    aggregation = PersonnelModel.aggregate(pipeLine);

    aggregation.options = {
        allowDiskUse: true
    };

    aggregation.exec(function (err, response) {
        if (err) {
            console.log(err);
        } else {
            cb(null, response[0] ? response[0].ids.concat([myId]) : [myId]);
        }
    });
};

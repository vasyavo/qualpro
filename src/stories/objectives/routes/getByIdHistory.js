const async = require('async');
const mongoose = require('mongoose');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const AccessManager = require('./../../../helpers/access')();
const ObjectiveHistoryModel = require('./../../../types/objectiveHistory/model');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const queryRun = (callback) => {
        const id = ObjectId(req.params.id);
        const pipeline = [{
            $match: { person: id },
        }, {
            $project: {
                _id: 1,
                objective: 1,
                person: 1,
            },
        }, {
            $lookup: {
                from: 'personnels',
                localField: 'person',
                foreignField: '_id',
                as: 'person',
            },
        }, {
            $lookup: {
                from: 'objectives',
                localField: 'objective',
                foreignField: '_id',
                as: 'objective',
            },
        }, {
            $project: {
                _id: 1,
                objective: { $arrayElemAt: ['$objective', 0] },
                person: { $arrayElemAt: ['$person', 0] },
            },
        }, {
            $project: {
                _id: 1,
                objective: {
                    _id: '$objective._id',
                    title: '$objective.title',
                    status: '$objective.status',
                },
                person: {
                    _id: '$person._id',
                    firstName: '$person.firstName',
                    lastName: '$person.lastName',
                },
            },
        }];

        ObjectiveHistoryModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([

        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.OBJECTIVE, cb);
        },

        (allowed, personnel, cb) => {
            queryRun(cb);
        },

    ], (err, result) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(result);
    });
};

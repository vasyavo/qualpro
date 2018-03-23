var _ = require('underscore');
var async = require('async');

function Archiver() {
    /*  Example
        [
            {
                idsToArchive: [1,2,3], // array of ids for archive
                keyForCondition: '_id', // key for query: {key: {$in: idsToArchive}}
                archived: true, // boolean archived
                topArchived: true, // optional boolean topArchived, if not given its will be not set
                model: CategoryModel // mongoose model object for update
            },
            {
                // in this step idsToArchive getting from previous step
                keyForCondition: 'category',
                keyForSelection: '_id,
                archived: true,
                topArchived: false,
                model: VariantModel
            },
            {
                keyForCondition: 'variant',
                archived: true,
                topArchived: false,
                model: ItemModel
            }
        ]
     */

    this.archive = function (uId, options, cb) {
        var self = this;

        this.idsToArchive = [];

        async.eachSeries(options, function (option, eachCb) {
            option.idsToArchive = option.idsToArchive || self.idsToArchive;
            option.keyForSelection = option.keyForSelection || '_id';

            self.archiveAll(uId, option, function (err) {
                if (err) {
                    return eachCb(err);
                }

                eachCb(null);
            });
        }, function (err) {
            if (err) {
                return cb(err);
            }

            cb(null);
        });
    };

    this.archiveAll = function (uId, option, cb) {
        var self = this;
        var query = option.query || {};

        query[option.keyForCondition] = {$in: option.idsToArchive};
        query[option.keyForCondition] = {$in: option.idsToArchive};
        if (option.filter) {
            query[option.filter.key] = {$in: [option.filter.value]}
        }

        async.parallel({
            data: function (parallelCb) {
                option.model.find(query, parallelCb);
            },
            update: function (parallelCb) {
                var updater = {};

                if (option.archived || option.archived === false) {
                    updater.archived = option.archived;
                }

                if (option.topArchived || option.topArchived === false) {
                    updater.topArchived = option.topArchived;
                }

                updater.editedBy = {
                    user: uId,
                    date: new Date()
                };

                option.model.update(query, updater, {multi: true}, parallelCb);
            }
        }, function (err, result) {
            if (err) {
                return cb(err);
            }

            self.idsToArchive = _.pluck(result.data, option.keyForSelection);
            cb(null);

        });
    };
}

module.exports = Archiver;

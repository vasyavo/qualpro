/*
* Wednesday, 15 February, 2017
* Feature "Documents"
* */
const async = require('async');

require('mongodb');

exports.up = function(db, next) {
    async.series([

        (cb) => {
            db.documents.update({}, {
                $rename: {
                    attachments: 'attachment',
                    contentType: 'before_props.contentType',
                    originalName: 'before_props.originalName',
                    preview: 'before_props.preview',
                },
            }, {
                multi: true,
            }, cb);
        },

        (cb) => {
            db.documents.update({}, {
                $set: {
                    type: 'file',
                    parent: null,
                    breadcrumbs: [],
                    deleted: false,
                },
            }, {
                multi: true,
            }, cb);
        },

        (cb) => {
            db.documents.update({}, {
                $unset: {
                    contentType: null,
                    originalName: null,
                    preview: null,
                },
            }, {
                multi: true,
            }, cb);
        },

    ], next);
};

exports.down = function(db, next) {
    async.waterfall([

        (cb) => {
            db.documents.update({}, {
                $rename: {
                    attachment: 'attachments',
                    'before_props.contentType': 'contentType',
                    'before_props.originalName': 'originalName',
                    'before_props.preview': 'preview',
                },
            }, {
                multi: true,
            }, cb);
        },

        (cb) => {
            db.documents.update({}, {
                $unset: {
                    type: null,
                    parent: null,
                    breadcrumbs: null,
                    deleted: null,
                },
            }, {
                multi: true,
            }, cb);
        },

    ], next);
};

const async = require('async');
const mongoose = require('mongoose');
const contentType = require('./../../../public/js/constants/contentType').PREVIEW;
const db = require('./../../../utils/mongo');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const id = req.params.id;

    async.waterfall([

        (cb) => {
            const query = { _id: ObjectId(id) };

            db.collection(contentType).findOne(query, {
                fields: {
                    base64: 1,
                },
            }, cb);
        },

        (result, cb) => {
            if (!result) {
                const error = new Error();

                error.status = 404;
                return next(error);
            }


            const base64Data = result.base64.replace(/^data:image\/\w+;base64,/, '');
            const body = new Buffer(base64Data, 'base64');

            cb(null, body);
        },

    ], (err, body) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(body);
    });
};

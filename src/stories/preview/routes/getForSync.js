const PreviewModel = require('../model');
const mongoose = require('mongoose');

const JSONStream = require('JSONStream');

const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const body = req.body;
    let previews = body.previews || [];

    if (!previews.length) {
        previews = [];
    }

    previews = previews.map((preview) => {
        return ObjectId(preview);
    });

    PreviewModel.find({
        _id: {
            $in: previews,
        },
    }).cursor().on('error', (err) => { next(err); }).pipe(JSONStream.stringify()).pipe(res.type('json'));
};

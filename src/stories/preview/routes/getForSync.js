const PreviewModel = require('../model');
const mongoose = require('mongoose');

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
    }, (err, result) => {
        if (err) {
            return next(err);
        }

        res.status(200).send(result);
    });
};

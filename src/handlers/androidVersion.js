
const AndroidVersion = function () {
    const AndroidVersionModel = require('./../types/androidVersion/model');
    this.getVersion = function(req, res, next) {
        const projection = {
            version: 1,
        };

        AndroidVersionModel.find({}, projection, (err, result) => {
            if (err) {
                res.status(200).send({});
            }

            if (result[0] && result[0].version) {
                res.status(200).send({ version: result[0].version });
            } else {
                res.status(200).send({});
            }
        });
    };
};

module.exports = AndroidVersion;

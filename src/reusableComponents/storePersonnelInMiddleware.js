const PersonnelModel = require('../types/personnel/model');

module.exports = (req, res, next) => {
    const uid = req.session.uId;
    const selection = {
        country : 1,
        region : 1,
        subRegion : 1,
        branch : 1
    };

    PersonnelModel.findById(uid, selection)
        .lean()
        .exec((err, personnel) => {
            if (err) {
                return next(err);
            }

            if (personnel) {
                req.personnelModel = personnel;
            }

            next();
        });
};

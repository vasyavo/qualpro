const access = require('../../../helpers/access')();
const mongoose = require('mongoose');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const getByIdAggr = require('../reusable-components/getByIdAggr');
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    function queryRun() {
        var id = ObjectId(req.params.id);
        var isMobile = req.isMobile;

        getByIdAggr({id: id, isMobile: isMobile}, function (err, result) {
            if (err) {
                return next(err);
            }

            res.status(200).send(result);
        });
    }

    access.getReadAccess(req, ACL_MODULES.CONSUMER_SURVEY, function (err) {
        if (err) {
            return next(err);
        }

        queryRun();
    });
};

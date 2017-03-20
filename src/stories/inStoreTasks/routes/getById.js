const mongoose = require('mongoose');
const ACL_MODULES = require('./../../../constants/aclModulesNames');
const access = require('./../../../helpers/access')();

const ObjectId = mongoose.Types.ObjectId;

module.exports = function (req, res, next) {
    function queryRun() {
        const id = ObjectId(req.params.id);
        const isMobile = req.isMobile;

        self.getByIdAggr({ id, isMobile }, (err, model) => {
            if (err) {
                return next(err);
            }

            res.status(200).send(model);
        });
    }

    access.getReadAccess(req, ACL_MODULES.IN_STORE_REPORTING, (err, allowed) => {
        if (err) {
            return next(err);
        }
        if (!allowed) {
            err = new Error();
            err.status = 403;

            return next(err);
        }

        queryRun();
    });
};

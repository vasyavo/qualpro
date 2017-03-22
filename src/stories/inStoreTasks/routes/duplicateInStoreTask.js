const ACL_MODULES = require('./../../../constants/aclModulesNames');
const OTHER_CONSTANTS = require('./../../../public/js/constants/otherConstants');
const ObjectiveModel = require('././../../../types/objective/model');
const access = require('./../../../helpers/access')();

const OBJECTIVE_STATUSES = OTHER_CONSTANTS.OBJECTIVE_STATUSES;

module.exports = function (req, res, next) {
    function queryRun() {
        const body = req.body;
        const inStoreTasks = body.id;
        const session = req.session;

        ObjectiveModel
            .findById(inStoreTasks, (err, inStoreTaskModel) => {
                let error;

                if (err) {
                    return next(err);
                }

                if (!inStoreTaskModel) {
                    error = new Error('In store task not found');
                    error.status = 400;

                    return next(error);
                }

                const inStoreTaskJSON = inStoreTaskModel.toJSON();

                req.body = {
                    objectiveType: inStoreTaskJSON.objectiveType,
                    priority: inStoreTaskJSON.priority,
                    status: OBJECTIVE_STATUSES.DRAFT,
                    formType: 'visibility',
                    level: session.level,
                    createdBy: {
                        user: session.uId,
                        date: Date.now(),
                    },
                    title: inStoreTaskJSON.title,
                    description: inStoreTaskJSON.description,
                };

                self.create(req, res, next);
            });
    }

    access.getWriteAccess(req, ACL_MODULES.IN_STORE_REPORTING, (err, allowed) => {
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

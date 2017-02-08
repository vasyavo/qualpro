const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.OBJECTIVE;
        const contentType = contentTypes.OBJECTIVES;
        const actionType = activityTypes.UPDATED;
        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            actionOriginator,
            setOriginator,
            setAssignee,
            setSupervisor,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: [
                actionOriginator,
                ...setOriginator,
                ...setAssignee,
                ...setSupervisor,
            ],
            subject: {
                en: 'Distribution Form updated',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};

const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./../objective/prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.IN_STORE_REPORTING;
        const contentType = contentTypes.INSTORETASKS;
        const actionType = activityTypes.UPDATED;
        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            setHighPriority,
            setAssignee,
            setSupervisor,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setHighPriority,
            subject: {
                en: 'In-store task failed',
                ar: '',
            },
            payload,
        }, {
            recipients: setAssignee,
            subject: {
                en: 'In-store task failed',
                ar: '',
            },
            payload,
        }, {
            recipients: setSupervisor,
            subject: {
                en: `Subordinate fails in-store task`,
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups, { moduleId });
    });
};

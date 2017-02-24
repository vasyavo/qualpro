const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.OBJECTIVE;
        const contentType = contentTypes.OBJECTIVES;
        const actionType = activityTypes.CREATED;
        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            setHighPriority,
            setOriginator,
            setAssignee,
            setSupervisor,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setHighPriority,
            subject: {
                en: 'Objective published',
                ar: '',
            },
            payload,
        }, {
            recipients: setOriginator,
            subject: {
                en: 'Sub-objective published',
                ar: '',
            },
            payload,
        }, {
            recipients: setAssignee,
            subject: {
                en: 'Received new objective',
                ar: '',
            },
            payload,
        }, {
            /*
             * if CA assign to AM
             * then CA is an originator
             * and supervisor at the same time
             * then save difference
             * */
            recipients: setSupervisor,
            subject: {
                en: 'Subordinate received new objective',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups, { moduleId });
    });
};

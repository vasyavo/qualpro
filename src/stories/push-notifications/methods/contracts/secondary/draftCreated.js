const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../prototypeDraft');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.CONTRACT_SECONDARY;
        const contentType = contentTypes.CONTRACTSSECONDARY;
        const actionType = activityTypes.CREATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            actionOriginator,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: [actionOriginator],
            subject: {
                en: 'Secondary Contract saved',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};

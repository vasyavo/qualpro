const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./../objective/state/inDraft');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.NOTE;
        const contentType = contentTypes.NOTES;
        const actionType = activityTypes.DELETED;
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
                en: 'Note deleted',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};

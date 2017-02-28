const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./../notes/prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.DOCUMENT;
        const contentType = contentTypes.DOCUMENTS;
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
                en: 'Folder created',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups, {
            actionOriginator,
            moduleId,
        });
    });
};

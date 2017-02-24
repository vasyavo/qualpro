const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const contentTypes = require('./../../../../public/js/constants/contentType');
const activityTypes = require('./../../../../constants/activityTypes');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.PERSONNEL;
        const contentType = contentTypes.PERSONNEL;
        const actionType = activityTypes.UPDATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            setEveryoneInLocation,
            name,
            } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setEveryoneInLocation,
            subject: {
                en: `Cover set for personnel ${name.en}`,
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups, { moduleId });
    });
};

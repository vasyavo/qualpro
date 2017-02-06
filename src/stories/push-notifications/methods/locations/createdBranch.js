const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.BRANCH;
        const contentType = contentTypes.BRANCH;
        const actionType = activityTypes.CREATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
            location : {
                setSubRegion : [options.body.subRegion]
            }
        });

        const {
            payload,
            setEveryoneInLocation,
            name,
            } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setEveryoneInLocation,
            subject: {
                en: `Branch ${name.en} ${actionType}`,
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};

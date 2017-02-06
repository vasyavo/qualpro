const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.SUB_REGION;
        const contentType = contentTypes.SUBREGION;
        const actionType = activityTypes.CREATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
            location : {
                setRegion : [options.body.parent]
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
                en: `Sub Region ${name.en} ${actionType}`,
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};

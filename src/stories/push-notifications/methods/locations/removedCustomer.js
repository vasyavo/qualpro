const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.CUSTOMER;
        const contentType = contentTypes.OUTLET;
        const actionType = activityTypes.ARCHIVED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
            itemId : options.body.subRegions ? options.body.subRegions[0] : null
        });

        if (options.body && options.body.subRegions){
            extendedOptions.location = {
                setSubRegion : options.body.subRegions
            }
        }

        const {
            payload,
            setEveryoneInLocation,
            name,
            } = yield prototype(extendedOptions);
        let groups;

        if (setEveryoneInLocation.length){
            groups = [{
                recipients: setEveryoneInLocation,
                subject: {
                    en: `Sub Region ${name.en} ${actionType}`,
                    ar: '',
                },
                payload,
            }];
        }

        yield dispatch(groups);
    });
};

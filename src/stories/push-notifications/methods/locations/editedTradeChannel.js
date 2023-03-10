const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.TRADE_CHANNEL;
        const contentType = contentTypes.RETAILSEGMENT;
        const actionType = activityTypes.UPDATED;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
            itemId: options.body.subRegions ? options.body.subRegions[0] : null,
        });

        if (options.body && options.body.subRegions) {
            extendedOptions.location = {
                setSubRegion: options.body.subRegions,
            };
        }

        const {
            actionOriginator,
            payload,
            setEveryoneInLocation,
            name,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setEveryoneInLocation,
            subject: {
                en: `Trade Channel ${name.en} ${actionType}`,
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

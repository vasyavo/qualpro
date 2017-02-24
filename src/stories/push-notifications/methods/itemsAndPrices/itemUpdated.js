const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.ITEMS_AND_PRICES;
        const contentType = contentTypes.ITEM;
        const actionType = activityTypes.UPDATED;
        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            payload,
            setEveryoneInCountry,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setEveryoneInCountry,
            subject: {
                en: 'Item updated',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups);
    });
};

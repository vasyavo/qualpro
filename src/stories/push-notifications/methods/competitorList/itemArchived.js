const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./../itemsAndPrices/prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.COMPETITOR_LIST;
        const contentType = contentTypes.COMPETITORITEM;
        const actionType = activityTypes.ARCHIVED;
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
                en: 'Competitor item archived',
                ar: '',
            },
            payload,
        }];

        yield dispatch(groups, { moduleId });
    });
};

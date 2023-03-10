const co = require('co');
const dispatch = require('./../../utils/dispatch');
const aclModules = require('./../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../constants/activityTypes');
const contentTypes = require('./../../../../public/js/constants/contentType');
const prototype = require('./../itemsAndPrices/prototype');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.PLANOGRAM;
        const contentType = contentTypes.PLANOGRAM;
        const actionType = activityTypes.UNARCHIVED;
        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        const {
            actionOriginator,
            payload,
            setEveryoneInCountry,
        } = yield prototype(extendedOptions);

        const groups = [{
            recipients: setEveryoneInCountry,
            subject: {
                en: 'Planogram unarchived',
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

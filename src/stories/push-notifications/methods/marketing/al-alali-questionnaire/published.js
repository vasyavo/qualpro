const co = require('co');
const dispatch = require('./../../../utils/dispatch');
const aclModules = require('./../../../../../constants/aclModulesNames');
const activityTypes = require('./../../../../../constants/activityTypes');
const contentTypes = require('./../../../../../public/js/constants/contentType');
const prototype = require('./../al-alali-questionnaire/prototypeUpdated');
const prototypeAssignedToPersonnel = require('./../al-alali-questionnaire/prototypeAssignedToPersonnel');

module.exports = (options) => {
    co(function * () {
        const moduleId = aclModules.AL_ALALI_QUESTIONNAIRE;
        const contentType = contentTypes.QUESTIONNARIES;
        const actionType = activityTypes.CREATED;
        let actionOriginator;
        let payload;
        let setEveryoneInLocation;

        const extendedOptions = Object.assign({}, options, {
            moduleId,
            contentType,
            actionType,
        });

        if (options.body.personnels && options.body.personnels[0]) {
            const activityDetails = yield prototypeAssignedToPersonnel(extendedOptions);

            actionOriginator = activityDetails.actionOriginator;
            payload = activityDetails.payload;
            setEveryoneInLocation = activityDetails.setEveryoneInLocation;
        } else {
            const activityDetails = yield prototype(extendedOptions);

            actionOriginator = activityDetails.actionOriginator;
            payload = activityDetails.payload;
            setEveryoneInLocation = activityDetails.setEveryoneInLocation;
        }

        const groups = [{
            recipients: setEveryoneInLocation,
            subject: {
                en: 'Questionnaire published',
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

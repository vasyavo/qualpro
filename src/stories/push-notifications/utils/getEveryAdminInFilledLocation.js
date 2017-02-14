const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../types/personnel/model');
const getEveryIn = require('./conditions/getEveryIn');
const getPipelineEveryInFilledLocation = require('./getPipelineEveryInFilledLocation');

/*
 * @description Returns every admin in filled location
 * @param {Object} options
 * @param {String[]} options.setCountry
 * @param {String[]} options.setRegion
 * @param {String[]} options.setSubRegion
 * @returns {String[]}
 * */

module.exports = function * (options) {
    const setCountry = ObjectId(options.setCountry);
    const setRegion = ObjectId(options.setRegion);
    const setSubRegion = ObjectId(options.setSubRegion);
    const condition = {};

    if (setCountry.length && setRegion.length && setSubRegion.length) {
        condition.$or = getEveryIn.subRegion.$or;
    } else if (setCountry.length && setRegion.length) {
        condition.$or = getEveryIn.region.$or;
    } else if (setCountry.length) {
        condition.$or = getEveryIn.country.$or;
    }

    const pipeline = getPipelineEveryInFilledLocation({
        setCountry,
        setRegion,
        setSubRegion,
        condition: {
            admins: condition,
        },
    });

    const result = yield PersonnelModel.aggregate(pipeline).exec();
    const setAdmin = result.slice()
        .pop()
        .setAdmin
        .filter(objectId => objectId)
        .map(objectId => objectId.toString());

    return setAdmin;
};

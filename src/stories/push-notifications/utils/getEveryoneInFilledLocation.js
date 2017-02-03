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
 * @param {String[]} options.setOutlet
 * @param {String[]} options.setBranch
 * @param {Boolean} options.onlyAdmins
 * @throws {Error}
 * @returns {String[]}
 * */

module.exports = function * (options) {
    const setCountry = ObjectId(options.setCountry);
    const setRegion = ObjectId(options.setRegion);
    const setSubRegion = ObjectId(options.setSubRegion);
    const setOutlet = ObjectId(options.setOutlet);
    const setBranch = ObjectId(options.setBranch);
    const condition = {
        admins: {},
        colleagues: options.onlyAdmins ? false : getEveryIn.outletAndBranch,
    };

    if (setCountry.length && setRegion.length && setSubRegion.length) {
        condition.admins = getEveryIn.subRegion;
    } else if (setCountry.length && setRegion.length) {
        condition.admins = getEveryIn.region;
    } else if (setCountry.length) {
        condition.admins = getEveryIn.country;
    } else {
        throw new Error('Not permitted use case');
    }

    const pipeline = getPipelineEveryInFilledLocation({
        setCountry,
        setRegion,
        setSubRegion,
        setOutlet,
        setBranch,
        condition,
    });

    const result = yield PersonnelModel.aggregate(pipeline).exec();
    const validResult = result.length ?
        result.slice().pop() : {
            setAdmin: [],
            setColleagues: [],
        };
    const setEveryone = [...validResult.setAdmin, ...validResult.setColleagues]
        .filter(objectId => objectId)
        .map(objectId => objectId.toString());

    return setEveryone;
};

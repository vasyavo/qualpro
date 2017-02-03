const ObjectId = require('mongoose').Types.ObjectId;
const PersonnelModel = require('./../../../types/personnel/model');
const getEveryIn = require('./conditions/getEveryIn');
const getPipelineEveryInFilledLocation = require('./getPipelineEveryInFilledLocation');

/*
 * @description Returns everyone in filled location
 * @param {Object} options
 * @param {String[]} options.setCountry
 * @param {String[]} options.setRegion
 * @param {String[]} options.setSubRegion
 * @param {String[]} options.setOutlet
 * @param {String[]} options.setBranch
 * @param {Boolean} options.setAdminOnly
 * @throws {Error}
 * @returns {String[]}
 * */

module.exports = function * (options) {
    const setCountry = options.setCountry.map(id => ObjectId(id));
    const setRegion = options.setRegion.map(id => ObjectId(id));
    const setSubRegion = options.setSubRegion.map(id => ObjectId(id));
    const setOutlet = options.setOutlet.map(id => ObjectId(id));
    const setBranch = options.setBranch.map(id => ObjectId(id));
    const condition = {
        admins: {},
        colleagues: options.setAdminOnly ? false : getEveryIn.outletAndBranch,
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

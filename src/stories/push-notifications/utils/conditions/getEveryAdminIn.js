const accessRoles = require('./../../../../constants/aclRolesNames');

const getHighAdmin = {
    $setIsSubset: [['$$item.accessRole.level'], [
        accessRoles.MASTER_ADMIN,
        accessRoles.TRADE_MARKETER,
    ]],
};

const setIsSubsetCountry = {
    $setIsSubset: ['$$item.country', '$$setCountry'],
};
const inCountry = {
    $or: [getHighAdmin, {
        $and: [{
            $eq: ['$$item.accessRole.level', accessRoles.COUNTRY_ADMIN],
        }, setIsSubsetCountry],
    }],
};

const setIntersectionRegion = {
    $gt: [{
        $setIntersection: ['$$item.region', '$$setRegion'],
    }, 0],
};
const includedToRegion = {
    $or: [...inCountry.$or, {
        $and: [{
            $eq: ['$$item.accessRole.level', accessRoles.AREA_MANAGER],
        }, setIsSubsetCountry, setIntersectionRegion],
    }],
};

const setIntersectionSubRegion = {
    $gt: [{
        $setIntersection: ['$$item.subRegion', '$$setSubRegion'],
    }, 0],
};
const includedToSubRegion = {
    $or: [...includedToRegion.$or, {
        $and: [{
            $eq: ['$$item.accessRole.level', accessRoles.AREA_IN_CHARGE],
        }, setIsSubsetCountry, setIntersectionRegion, setIntersectionSubRegion],
    }],
};

module.exports = {
    country: inCountry,
    region: includedToRegion,
    subRegion: includedToSubRegion,
};

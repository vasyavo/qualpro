const accessRoles = require('./../../../../constants/aclRolesNames');

const getHighAdmin = {
    $setIsSubset: [['$$accessRoleLevel'], [
        accessRoles.MASTER_ADMIN,
        accessRoles.TRADE_MARKETER,
    ]],
};

const setIsSubsetCountry = {
    $setIsSubset: ['$$personnel.country', '$$setCountry'],
};
const inCountry = {
    $or: [getHighAdmin, {
        $and: [{
            $setIsSubset: [['$$accessRoleLevel'], [
                accessRoles.COUNTRY_ADMIN,
                accessRoles.AREA_MANAGER,
                accessRoles.AREA_IN_CHARGE,
            ]],
        }, setIsSubsetCountry],
    }],
};

const setIntersectionRegion = {
    $gt: [{
        $setIntersection: ['$$personnel.region', '$$setRegion'],
    }, 0],
};
const includedToRegion = {
    $or: [getHighAdmin, {
        $and: [{
            $eq: ['$$accessRoleLevel', accessRoles.COUNTRY_ADMIN],
        }, setIsSubsetCountry],
    }, {
        $and: [{
            $setIsSubset: [['$$accessRoleLevel'], [
                accessRoles.AREA_MANAGER,
                accessRoles.AREA_IN_CHARGE,
            ]],
        }, setIsSubsetCountry, setIntersectionRegion],
    }],
};

const setIntersectionSubRegion = {
    $gt: [{
        $setIntersection: ['$$personnel.subRegion', '$$setSubRegion'],
    }, 0],
};
const includedToSubRegion = {
    $or: [getHighAdmin, {
        $and: [{
            $eq: ['$$accessRoleLevel', accessRoles.COUNTRY_ADMIN],
        }, setIsSubsetCountry],
    }, {
        $and: [{
            $eq: ['$$accessRoleLevel', accessRoles.AREA_MANAGER],
        }, setIsSubsetCountry, setIntersectionRegion],
    }, {
        $and: [{
            $eq: ['$$accessRoleLevel', accessRoles.AREA_IN_CHARGE],
        }, setIsSubsetCountry, setIntersectionRegion, setIntersectionSubRegion],
    }],
};

module.exports = {
    country: inCountry,
    region: includedToRegion,
    subRegion: includedToSubRegion,
};

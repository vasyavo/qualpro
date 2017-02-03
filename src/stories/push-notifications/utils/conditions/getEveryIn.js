const accessRoles = require('./../../../../constants/aclRolesNames');

const isHighAdmin = {
    $setIsSubset: [['$$accessRoleLevel'], [
        accessRoles.MASTER_ADMIN,
        accessRoles.TRADE_MARKETER,
    ]],
};

const setIsSubsetCountry = {
    $setIsSubset: ['$$personnel.country', '$$setCountry'],
};
const inCountry = {
    $or: [isHighAdmin, {
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
    $or: [isHighAdmin, {
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
    $or: [isHighAdmin, {
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

const setIntersectionOutlet = {
    $gt: [{
        $setIntersection: ['$$personnel.outlet', '$$setOutlet'],
    }, 0],
};
const setIntersectionBranch = {
    $gt: [{
        $setIntersection: ['$$personnel.branch', '$$setBranch'],
    }, 0],
};

const isColleague = {
    $setIsSubset: [['$$accessRoleLevel'], [
        accessRoles.SALES_MAN,
        accessRoles.MERCHANDISER,
        accessRoles.CASH_VAN,
    ]],
};
const byOutletAndBranch = {
    // if questionnaire or survey related to
    $and: [isColleague, {
        $cond: {
            // exclusive set of branch
            if: {
                $gt: [{
                    $size: '$$setBranch',
                }, 0],
            },
            then: setIntersectionBranch,
            else: {
                $cond: {
                    // exclusive set of outlet
                    if: {
                        $gt: [{
                            $size: '$$setOutlet',
                        }, 0],
                    },
                    then: setIntersectionOutlet,
                    else: {
                        $cond: {
                            if: {
                                $gt: [{
                                    $size: '$$setSubRegion',
                                }, 0],
                            },
                            then: setIntersectionSubRegion,
                            else: {
                                $cond: {
                                    if: {
                                        $gt: [{
                                            $size: '$$setRegion',
                                        }, 0],
                                    },
                                    then: setIntersectionRegion,
                                    else: {
                                        $cond: {
                                            if: {
                                                $gt: [{
                                                    $size: '$$setCountry',
                                                }, 0],
                                            },
                                            then: setIsSubsetCountry,
                                            else: false,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }],
};

module.exports = {
    country: inCountry,
    region: includedToRegion,
    subRegion: includedToSubRegion,
    outletAndBranch: byOutletAndBranch,
};

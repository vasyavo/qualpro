const _ = require('lodash');
const moment = require('moment');
const trimObjectValues = require('../../utils/trimObjectValues');
const DomainModel = require('../../../../../types/domain/model');
const BranchModel = require('../../../../../types/branch/model');
const PositionModel = require('../../../../../types/position/model');
const AccessRoleModel = require('../../../../../types/accessRole/model');
const PersonnelModel = require('../../../../../types/personnel/model');
const logger = require('../../../../../utils/logger');

function getStringForRegex(str) {
    return _.trim(_.escapeRegExp(str))
}

function* getDomainId(name, type = 'country') {
    const search = {
        type,
        topArchived : false,
        archived : false,
        'name.en': {
            $regex  : getStringForRegex(name),
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield DomainModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found ${type}: ${name}`);
    }

    return data;
}

function* getBranchId(name) {
    const search = {
        archived : false,
        topArchived : false,
        'name.en': {
            $regex  : getStringForRegex(name),
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield BranchModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found branch: ${name}`);
    }

    return data;
}

function* getPositionId(name) {
    const search = {
        'name.en': {
            $regex  : getStringForRegex(name),
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield PositionModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found position: ${name}`);
    }

    return data;
}

function* getAccessRoleId(name) {
    const search = {
        'name.en': {
            $regex  : getStringForRegex(name),
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield AccessRoleModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found access role: ${name}`);
    }

    return data;
}

function* getManagerId(str) {
    const search = {
        $or: [
            {
                email: {$eq: str}
            }, {
                phoneNumber: {$eq: str}
            }
        ]
    };

    let data;
    try {
        data = yield PersonnelModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found manager with email/phone: ${str}`);
    }

    return data;
}

function* getMainDependencies(options) {
    const {
        country: countriesStr = '',
        region: regionsStr = '',
        subRegion: subRegionsStr = '',
        branch: branchesStr = '',
        position,
        accessRole,
        manager,
    } = options;
    const countriesNamesArr = countriesStr.split(',').filter(el => el);
    const regionsNamesArr = regionsStr.split(',').filter(el => el);
    const subRegionsNamesArr = subRegionsStr.split(',').filter(el => el);
    const branchNamesArr = branchesStr.split('|').filter(el => el);


    // split by separator and search in db for each elements in array
    let countries = [];
    if (countriesNamesArr.length) {
        for (const str of countriesNamesArr) {
            let id;
            try {
                id = yield* getDomainId(str, 'country');
            } catch (ex) {
                throw ex;
            }

            countries.push(id)
        }
    }

    let regions = [];
    if (regionsNamesArr.length) {
        for (const str of regionsNamesArr) {
            let id;
            try {
                id = yield* getDomainId(str, 'region');
            } catch (ex) {
                throw ex;
            }

            regions.push(id)
        }
    }

    let subRegions = [];
    if (subRegionsNamesArr.length) {
        for (const str of subRegionsNamesArr) {
            let id;
            try {
                id = yield* getDomainId(str, 'subRegion');
            } catch (ex) {
                throw ex;
            }

            subRegions.push(id)
        }
    }

    let branches = [];
    if (branchNamesArr.length) {
        for (const str of branchNamesArr) {
            let id;
            try {
                id = yield* getBranchId(str);
            } catch (ex) {
                throw ex;
            }

            branches.push(id)
        }
    }

    let positionId = [];
    try {
        positionId = yield* getPositionId(position);
    } catch (ex) {
        throw ex;
    }

    let accessRoleId = [];
    try {
        accessRoleId = yield* getAccessRoleId(accessRole);
    } catch (ex) {
        throw ex;
    }

    let managerId;
    if (manager) {
        try {
            managerId = yield* getManagerId(manager);
        } catch (ex) {
            throw ex;
        }
    }

    return {
        country   : countries,
        region    : regions,
        subRegion : subRegions,
        branch    : branches,
        position  : positionId,
        accessRole: accessRoleId,
        manager   : managerId
    }
}

function* createOrUpdate(payload) {
    const options = trimObjectValues(payload, {includeValidation: true});
    const {
        enFirstName,
        arFirstName,
        enLastName,
        arLastName,
        email,
        phoneNumber,
        dateJoined
    } = options;
    const query = {};

    let mainDeps;
    try {
        mainDeps = yield* getMainDependencies(options);
    } catch (ex) {
        throw ex;
    }

    const rawOpt = {
        firstName: {
            en: enFirstName,
            ar: arFirstName,
        },

        lastName: {
            en: enLastName,
            ar: arLastName,
        }
    };

    if (!email && !phoneNumber) {
        throw new Error('Please specify email or phone number to identify personnel');
    }

    if (email) {
        rawOpt.email = email;
        query.email = email;
    }

    if (!email && phoneNumber) {
        rawOpt.phoneNumber = phoneNumber;
        query.phoneNumber = phoneNumber;
    }

    if (dateJoined) {
        const parsedDate = moment(dateJoined);

        if (parsedDate.isValid()) {
            rawOpt.dateJoined = parsedDate.toDate();
        }
    }

    const setObj = Object.assign(rawOpt, mainDeps);

    const modify = {
        $set: setObj,

        $setOnInsert: {
            createdBy: {
                user: null,
                date: new Date()
            },

            editedBy: {
                user: null,
                date: new Date()
            }
        }
    };

    const opt = {
        new                : true,
        upsert             : true,
        runValidators      : true,
        setDefaultsOnInsert: true
    };

    try {
        yield PersonnelModel.update(query, modify, opt);
    } catch (ex) {
        throw ex;
    }
}

module.exports = function* importer(data) {
    let numImported = 0;
    let numErrors = 0;
    let errors = [];

    for (const element of data) {
        try {
            yield* createOrUpdate(element);

            numImported += 1;
        } catch (ex) {
            const rowNum = !isNaN(element.__rowNum__) ? (element.__rowNum__ + 1) : '-';
            const msg = `Error to import personnel id: ${element.id || '-'} row: ${rowNum}. \n Details: ${ex}`;

            logger.warn(msg);
            errors.push(msg);
            numErrors += 1;
        }
    }

    return {numErrors, numImported, errors};
};

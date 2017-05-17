const _ = require('lodash');
const trimObjectValues = require('../../utils/trimObjectValues');
const DomainModel = require('../../../../../types/domain/model');
const RetailSegmentModel = require('../../../../../types/retailSegment/model');
const OutletModel = require('../../../../../types/outlet/model');
const BranchModel = require('../../../../../types/branch/model');
const logger = require('../../../../../utils/logger');

function* getSubRegionId(name) {
    const search = {
        type     : 'subRegion',
        archived : false,
        topArchived : false,
        'name.en': {
            $regex  : `^${_.escapeRegExp(name)}$`,
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
        throw new Error(`Can not found sub-region: ${name}`);
    }

    return data;
}

function* getRetailSegmentId(name) {
    const search = {
        archived : false,
        topArchived : false,
        'name.en': {
            $regex  : `^${_.escapeRegExp(name)}$`,
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield RetailSegmentModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found retail segment: ${name}`);
    }

    return data;
}

function* getOutletId(name) {
    const search = {
        archived : false,
        topArchived : false,
        'name.en': {
            $regex  : `^${_.escapeRegExp(name)}$`,
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield OutletModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found outlet: ${name}`);
    }

    return data;
}

function* createOrUpdate(payload) {
    const options = trimObjectValues(payload, {includeValidation: true});
    const {
        enName,
        arName,
        enAddress,
        arAddress,
        subRegion,
        retailSegment,
        outlet
    } = options;

    if (!enName) {
        throw new Error(`Validation failed, Name(EN) is required.`);
    }

    let subRegionId;
    try {
        subRegionId = yield* getSubRegionId(subRegion);
    } catch (ex) {
        throw ex;
    }

    let retailSegmentId;
    try {
        retailSegmentId = yield* getRetailSegmentId(retailSegment);
    } catch (ex) {
        throw ex;
    }

    let outletId;
    try {
        outletId = yield* getOutletId(outlet);
    } catch (ex) {
        throw ex;
    }


    const query = {
        'name.en'    : enName,
        'name.ar'    : arName,
        retailSegment: retailSegmentId,
        subRegion    : subRegionId,
        outlet       : outletId,
    };

    const modify = {
        $set: {
            name: {
                en: enName,
                ar: arName,
            },

            address: {
                en: enAddress,
                ar: arAddress
            },

            retailSegment: retailSegmentId,
            subRegion    : subRegionId,
            outlet       : outletId,
        },

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
        yield BranchModel.update(query, modify, opt);
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
            const msg = `Error to import branch id: ${element.id}. \n Details: ${ex}`;

            logger.warn(msg);
            errors.push(msg);
            numErrors += 1;
        }
    }

    return {numErrors, numImported, errors};
};

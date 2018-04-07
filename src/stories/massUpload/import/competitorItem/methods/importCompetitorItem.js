const _ = require('lodash');
const trimObjectValues = require('../../utils/trimObjectValues');
const OriginModel = require('../../../../../types/origin/model');
const BrandModel = require('../../../../../types/brand/model');
const CompetitorVariantModel = require('../../../../../types/competitorVariant/model');
const DomainModel = require('../../../../../types/domain/model');
const CompetitorItemModel = require('../../../../../types/competitorItem/model');
const logger = require('../../../../../utils/logger');

const intNumberRegExp = /[0-9]+/;

function* getOriginId(name) {
    const search = {
        'name.en': {
            $regex  : `^${_.trim(_.escapeRegExp(name))}$`,
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield OriginModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found origin: ${name}`);
    }

    return data;
}

function* getBrandId(name) {
    const search = {
        archived : false,
        'name.en': {
            $regex  : `^${_.trim(_.escapeRegExp(name))}$`,
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield BrandModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found brand: ${name}`);
    }

    return data;
}

function* getVariantByBrandAndNameId(name, brandId) {
    const search = {
        archived : false,
        'name.en': {
            $regex  : `^${_.trim(_.escapeRegExp(name))}$`,
            $options: 'i'
        },
        brand: brandId
    };

    let data;
    try {
        data = yield CompetitorVariantModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found variant: ${name}`);
    }

    return data;
}

function* getCountryId(name) {
    const search = {
        archived : false,
        type     : 'country',
        'name.en': {
            $regex  : `^${_.trim(_.escapeRegExp(name))}$`,
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
        throw new Error(`Can not found country: ${name}`);
    }

    return data;
}

function* createOrUpdate(payload) {
    const options = trimObjectValues(payload, {includeValidation: true});
    const {
        enName,
        arName,
        size,
        brand,
        origin,
        variant,
        country
    } = options;

    if (!enName) {
        throw new Error(`Validation failed, Name(EN) is required.`);
    }

    if (!intNumberRegExp.test(size)) {
        throw new Error(`Validation failed, Weight should be a number.`);
    }

    let originId;
    if (origin) {
        try {
            originId = yield* getOriginId(origin);
        } catch (ex) {
            throw ex;
        }
    }

    let brandId;
    try {
        brandId = yield* getBrandId(brand);
    } catch (ex) {
        throw ex;
    }

    let variantId;
    try {
        variantId = yield* getVariantByBrandAndNameId(variant, brandId);
    } catch (ex) {
        throw ex;
    }

    let countryId;
    try {
        countryId = yield* getCountryId(country);
    } catch (ex) {
        throw ex;
    }

    const query = {
        'name.en': enName,
        packing  : size,
        brand    : brandId,
        country  : countryId,
    };

    const modify = {
        $set: {
            packing: size,
            origin : [originId],
            brand  : brandId,
            variant: variantId,
            country: countryId,

            name: {
                en: enName,
                ar: arName,
            }
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
        yield CompetitorItemModel.update(query, modify, opt);
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
            const msg = `Error to import competitor item id: ${element.id || '-'} row: ${rowNum}. \n Details: ${ex}`;

            logger.warn(msg);
            errors.push(msg);
            numErrors += 1;
        }
    }

    return {numErrors, numImported, errors};
};

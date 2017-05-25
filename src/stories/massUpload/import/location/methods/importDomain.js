const _ = require('lodash');
const trimObjectValues = require('../../utils/trimObjectValues');
const DomainModel = require('../../../../../types/domain/model');
const CurrencyModel = require('../../../../../types/currency/model');
const logger = require('../../../../../utils/logger');

function normalizeString(str) {
    let normalized = '';

    if (_.isString(str)) {
        normalized = str.trim().toLowerCase().replace(' ', '');
    }

    return normalized;
}

function mapDomainType(rawType) {
    switch (rawType) {
        case 'country':
        case 'region':
            return rawType;
        case 'sub-region':
            return 'subRegion';
        default:
            return rawType;

    }
}

function getParentType(rawType) {
    switch (rawType) {
        case 'region':
            return 'country';
        case 'subRegion':
            return 'region';
        default:
            return rawType;

    }
}

function* getParentDomainId(childType, parentName) {
    const parentType = getParentType(childType);

    if (!parentName || parentName === 'null') {
        return null;
    }

    const search = {
        type       : parentType,
        topArchived: false,
        archived   : false,
        'name.en'  : {
            $regex  : `^${_.escapeRegExp(parentName)}$`,
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield DomainModel.findOne(search, {_id: 1}).lean().then(doc => doc && doc._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found parent location - type: ${parentType}, name: ${parentName}`);
    }

    return data;
}

function* createOrUpdate(currencies, payload) {
    const options = trimObjectValues(payload, {includeValidation: true});
    const {
        enName,
        arName,
        currency,
        type,
        parent
    } = options;

    if (!enName) {
        throw new Error(`Validation failed, Name(EN) is required.`);
    }

    const parsedType = mapDomainType(type);

    let parentProp;
    try {
        parentProp = yield* getParentDomainId(parsedType, parent);
    } catch (ex) {
        throw ex;
    }

    if (parsedType === 'country' && !currencies.includes(currency)) {
        throw new Error(`Currency "${currency}" not found.`);
    }

    const query = {
        'name.en': enName,
        type     : parsedType,
    };

    const modify = {
        $set: {
            name: {
                en: enName,
                ar: arName,
            },

            type  : parsedType,
            parent: parentProp,
            currency,
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
        yield DomainModel.update(query, modify, opt);
    } catch (ex) {
        throw ex;
    }
}

module.exports = function* importer(data) {
    let numImported = 0;
    let numErrors = 0;
    let errors = [];

    let currencies;
    try {
        currencies = yield CurrencyModel.distinct('_id')
    } catch (ex) {
        throw ex;
    }

    // filter into 3 arrays countries, regions, subRegions
    const countries = data.filter(elem => normalizeString(elem.type) === 'country');
    const regions = data.filter(elem => normalizeString(elem.type) === 'region');
    const subRegions = data.filter(elem => normalizeString(elem.type) === 'sub-region');

    // separate array with not valid type
    const validTypes = ['country', 'region', 'sub-region'];
    const elementsWithNotValidType = data.filter(elem => !validTypes.includes(normalizeString(elem.type)));

    for (const element of elementsWithNotValidType) {
        const msg = `Error to import location id: ${element.id}. \n Details: Type should be one of [${validTypes.join(', ')}]`;

        logger.warn(msg);
        errors.push(msg);
        numErrors += 1;
    }

    for (const element of countries) {
        try {
            yield* createOrUpdate(currencies, element);

            numImported += 1;
        } catch (ex) {
            const msg = `Error to import location id: ${element.id}. \n Details: ${ex}`;

            logger.warn(msg);
            errors.push(msg);
            numErrors += 1;
        }
    }

    for (const element of regions) {
        try {
            yield* createOrUpdate(currencies, element);

            numImported += 1;
        } catch (ex) {
            const msg = `Error to import location id: ${element.id}. \n Details: ${ex}`;

            logger.warn(msg);
            errors.push(msg);
            numErrors += 1;
        }
    }

    for (const element of subRegions) {
        try {
            yield* createOrUpdate(currencies, element);

            numImported += 1;
        } catch (ex) {
            const rowNum = !isNaN(element.__rowNum__) ? (element.__rowNum__ + 1) : '-';
            const msg = `Error to import location id: ${element.id || '-'} row: ${rowNum}. \n Details: ${ex}`;

            logger.warn(msg);
            errors.push(msg);
            numErrors += 1;
        }
    }

    return {numErrors, numImported, errors};
};

const _ = require('lodash');
const trimObjectValues = require('../../utils/trimObjectValues');
const OriginModel = require('../../../../../types/origin/model');
const CategoryModel = require('../../../../../types/category/model');
const VariantModel = require('../../../../../types/variant/model');
const DomainModel = require('../../../../../types/domain/model');
const ItemModel = require('../../../../../types/item/model');
const ItemHistoryModel = require('../../../../../types/itemHistory/model');
const logger = require('../../../../../utils/logger');

const intNumberRegExp = /[0-9]+/;
const priceQualProRegExp = /(^[0-9]+(\.[0-9]{1,3})?)$/;

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

function* getCategoryId(name) {
    const search = {
        archived : false,
        'name.en': {
            $regex  : `^${_.trim(_.escapeRegExp(name))}$`,
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield CategoryModel.findOne(search, {_id: 1})
            .lean()
            .then(data => data && data._id);
    } catch (ex) {
        throw ex;
    }

    if (!data) {
        throw new Error(`Can not found category: ${name}`);
    }

    return data;
}

function* getVariantId(name) {
    const search = {
        archived : false,
        'name.en': {
            $regex  : `^${_.trim(_.escapeRegExp(name))}$`,
            $options: 'i'
        }
    };

    let data;
    try {
        data = yield VariantModel.findOne(search, {_id: 1})
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
        barcode,
        packing,
        ppt,
        pptPerCase,
        rspMin,
        rspMax,
        category,
        origin,
        variant,
        country
    } = options;

    if (!enName) {
        throw new Error(`Validation failed, Name(EN) is required.`);
    }

    if (!intNumberRegExp.test(barcode)) {
        throw new Error(`Validation failed, Barcode should be a number.`);
    }

    if (!priceQualProRegExp.test(ppt)) {
        throw new Error(`Validation failed, PPT is not valid.`);
    }

    if (!priceQualProRegExp.test(pptPerCase)) {
        throw new Error(`Validation failed, PPT (Case) is not valid.`);
    }

    if (!priceQualProRegExp.test(rspMin)) {
        throw new Error(`Validation failed, RSP (Minimum) is not valid.`);
    }

    if (!priceQualProRegExp.test(rspMax)) {
        throw new Error(`Validation failed, RSP (Maximum) is not valid.`);
    }

    let originId;
    if (origin) {
        try {
            originId = yield* getOriginId(origin);
        } catch (ex) {
            throw ex;
        }
    }

    let categoryId;
    try {
        categoryId = yield* getCategoryId(category);
    } catch (ex) {
        throw ex;
    }

    let variantId;
    try {
        variantId = yield* getVariantId(variant);
    } catch (ex) {
        throw ex;
    }

    let countryId;
    try {
        countryId = yield* getCountryId(country);
    } catch (ex) {
        throw ex;
    }

    const pptNum = isNaN(ppt) ? 0 : parseFloat(ppt);
    const pptPerCaseNum = isNaN(pptPerCase) ? 0 : parseFloat(pptPerCase);
    const rspMinNum = isNaN(rspMin) ? 0 : parseFloat(rspMin);
    const rspMaxNum = isNaN(rspMax) ? 0 : parseFloat(rspMax);

    const query = {
        'name.en': enName,
        packing: packing,
        country  : countryId,
    };

    const modify = {
        $set: {
            barCode   : barcode,
            ppt       : Math.round(pptNum * 1000),
            pptPerCase: Math.round(pptPerCaseNum * 1000),
            rspMin    : Math.round(rspMinNum * 1000),
            rspMax    : Math.round(rspMaxNum * 1000),
            packing   : packing,
            origin    : originId,
            category  : categoryId,
            variant   : variantId,
            country   : countryId,

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

    let itemModel;

    try {
        itemModel = yield ItemModel.findOneAndUpdate(query, modify, opt);
    } catch (ex) {
        throw ex;
    }

    const body = {
        headers: {
            itemId: itemModel._id,
            contentType: 'item',
            actionType: 'itemChanged',
            user: itemModel.createdBy.user,
            date: new Date(),
        },
        payload: itemModel,
    };

    const itemHistoryModel = new ItemHistoryModel(body);

    itemHistoryModel.save();
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
            const msg = `Error to import item id: ${element.id || '-'} row: ${rowNum}. \n Details: ${ex}`;

            logger.warn(msg);
            errors.push(msg);
            numErrors += 1;
        }
    }

    return {numErrors, numImported, errors};
};

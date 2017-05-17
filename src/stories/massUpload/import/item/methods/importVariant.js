const _ = require('lodash');
const trimObjectValues = require('../../utils/trimObjectValues');
const CategoryModel = require('../../../../../types/category/model');
const VariantModel = require('../../../../../types/variant/model');
const logger = require('../../../../../utils/logger');


function* getCategoryId(name) {
    const search = {
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
        throw new Error(`Can not found sub-region: ${name}`);
    }

    return data;
}

function* createOrUpdate(payload) {
    const options = trimObjectValues(payload, {includeValidation: true});
    const {
        enName,
        arName,
        category,
    } = options;

    if (!enName) {
        throw new Error(`Validation failed, Name(EN) is required.`);
    }

    let categoryId;
    try {
        categoryId = yield* getCategoryId(category);
    } catch (ex) {
        throw ex;
    }

    const query = {
        'name.en': enName,
        archived : false,
    };

    const modify = {
        $set: {
            category: categoryId,
            name    : {
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
        yield VariantModel.update(query, modify, opt);
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
            const msg = `Error to import variant id ${element.id}. \n Details: ${ex}`;

            logger.warn(msg);
            errors.push(msg);
            numErrors += 1;
        }
    }

    return {numErrors, numImported, errors};
};

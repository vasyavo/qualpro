const _ = require('lodash');
const trimObjectValues = require('../../utils/trimObjectValues');
const OriginModel = require('../../../../../types/origin/model');
const logger = require('../../../../../utils/logger');

function* createOrUpdate(payload) {
    const options = trimObjectValues(payload, {includeValidation: true});
    const {
        enName,
        arName,
    } = options;

    if (!enName) {
        throw new Error(`Validation failed, Name(EN) is required.`);
    }

    const query = {
        'name.en': enName
    };

    const modify = {
        $set: {
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
        yield OriginModel.update(query, modify, opt);
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
            const msg = `Error to import origin id: ${element.id || '-'} row: ${rowNum}. \n Details: ${ex}`;

            logger.warn(msg);
            errors.push(msg);
            numErrors += 1;
        }
    }

    return {numErrors, numImported, errors};
};

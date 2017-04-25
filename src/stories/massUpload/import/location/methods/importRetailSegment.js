const _ = require('lodash');
const trimObjectValues = require('../../utils/trimObjectValues');
const RetailSegmentModel = require('../../../../../types/retailSegment/model');
const logger = require('../../../../../utils/logger');

function* createOrUpdate(payload) {
    const options = trimObjectValues(payload);
    const {
        enName,
        arName,
    } = options;

    const query = {
        'name.en': enName,
        archived : false,
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
        yield RetailSegmentModel.update(query, modify, opt);
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
            const msg = `Error to import retail segment id ${element.id}. \n Details: ${ex}`;

            logger.warn(msg);
            errors.push(msg);
            numErrors += 1;
        }
    }

    return {numErrors, numImported, errors};
};

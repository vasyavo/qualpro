const loader = require('../utils/loadSheetFromFile');
const importOrigin = require('./methods/importOrigin');
const importCategory = require('./methods/importCategory');
const importVariant = require('./methods/importVariant');
const importItem = require('./methods/importItem');
const logger = require('../../../../utils/logger');
const {
    SHEETS: {
        ORIGIN,
        BRAND,
        CATEGORY,
        VARIANT,
        ITEM,
    }
} = require('../../../../constants/import');

const loadWorkbookOptions = {
    sheets: [
        {
            returnAs : 'originData',
            sheetName: ORIGIN.sheetName,
            header   : ORIGIN.header,
            headerRow: ORIGIN.headerRow
        }, {
            returnAs : 'categoryData',
            sheetName: CATEGORY.sheetName,
            header   : CATEGORY.header,
            headerRow: CATEGORY.headerRow
        }, {
            returnAs : 'competitorVariantData',
            sheetName: VARIANT.sheetName,
            header   : VARIANT.header,
            headerRow: VARIANT.headerRow
        }, {
            returnAs : 'competitorItemData',
            sheetName: ITEM.sheetName,
            header   : ITEM.header,
            headerRow: ITEM.headerRow
        }
    ]
};

module.exports = function* importer(filePath) {
    let result = [];

    let workbookData;
    try {
        workbookData = loader(filePath, loadWorkbookOptions);
    } catch (ex) {
        throw ex;
    }

    const {
        originData = [],
        categoryData = [],
        competitorVariantData = [],
        competitorItemData = []
    } = workbookData;

    // import origins
    try {
        const data = yield* importOrigin(originData);

        data.sheet = ORIGIN.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : ORIGIN.sheetName,
            errors: [ex]
        });

        throw ex;
    }

    // import categories
    try {
        const data = yield* importCategory(categoryData);

        data.sheet = CATEGORY.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : CATEGORY.sheetName,
            errors: [ex]
        });

        throw ex;
    }

    // import variants
    try {
        const data = yield* importVariant(competitorVariantData);

        data.sheet = VARIANT.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : VARIANT.sheetName,
            errors: [ex]
        });

        throw ex;
    }

    // import items
    try {
        const data = yield* importItem(competitorItemData);

        data.sheet = ITEM.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : ITEM.sheetName,
            errors: [ex]
        });

        throw ex;
    }

    const {
        totalImported,
        totalErrors
    } = result.reduce((memo, el) => {
        return {
            totalImported: (memo.totalImported + el.numImported),
            totalErrors  : (memo.totalErrors + el.numErrors)
        };
    }, {totalImported: 0, totalErrors: 0});

    const data = {
        totalImported,
        totalErrors,
        result
    };

    return data;
};

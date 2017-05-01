const loader = require('../utils/loadSheetFromFile');
const importOrigin = require('./methods/importOrigin');
const importBrand = require('./methods/importBrand');
const importCategory = require('./methods/importCategory');
const importCompetitorVariant = require('./methods/importCompetitorVariant');
const importCompetitorItem = require('./methods/importCompetitorItem');
const logger = require('../../../../utils/logger');
const {
    SHEETS: {
        ORIGIN,
        BRAND,
        CATEGORY,
        COMPETITOR_VARIANT,
        COMPETITOR_ITEM,
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
            returnAs : 'brandData',
            sheetName: BRAND.sheetName,
            header   : BRAND.header,
            headerRow: BRAND.headerRow
        }, {
            returnAs : 'categoryData',
            sheetName: CATEGORY.sheetName,
            header   : CATEGORY.header,
            headerRow: CATEGORY.headerRow
        }, {
            returnAs : 'competitorVariantData',
            sheetName: COMPETITOR_VARIANT.sheetName,
            header   : COMPETITOR_VARIANT.header,
            headerRow: COMPETITOR_VARIANT.headerRow
        }, {
            returnAs : 'competitorItemData',
            sheetName: COMPETITOR_ITEM.sheetName,
            header   : COMPETITOR_ITEM.header,
            headerRow: COMPETITOR_ITEM.headerRow
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
        brandData = [],
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

    // import brands
    try {
        const data = yield* importBrand(brandData);

        data.sheet = BRAND.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : BRAND.sheetName,
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

    // import competitor variants
    try {
        const data = yield* importCompetitorVariant(competitorVariantData);

        data.sheet = COMPETITOR_VARIANT.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : COMPETITOR_VARIANT.sheetName,
            errors: [ex]
        });

        throw ex;
    }

    // import competitor items
    try {
        const data = yield* importCompetitorItem(competitorItemData);

        data.sheet = COMPETITOR_ITEM.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : COMPETITOR_ITEM.sheetName,
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

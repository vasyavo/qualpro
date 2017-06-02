const loader = require('../utils/loadSheetFromFile');
const importDomain = require('./methods/importDomain');
const importRetailSegment = require('./methods/importRetailSegment');
const importOutlet = require('./methods/importOutlet');
const importBranch = require('./methods/importBranch');
const logger = require('../../../../utils/logger');
const {
    SHEETS: {
        LOCATION,
        RETAIL_SEGMENT,
        OUTLET,
        BRANCH
    }
} = require('../../../../constants/import');

const loadWorkbookOptions = {
    sheets: [
        {
            returnAs : 'domainData',
            sheetName: LOCATION.sheetName,
            header   : LOCATION.header,
            headerRow: LOCATION.headerRow
        }, {
            returnAs : 'retailSegmentData',
            sheetName: RETAIL_SEGMENT.sheetName,
            header   : RETAIL_SEGMENT.header,
            headerRow: RETAIL_SEGMENT.headerRow
        }, {
            returnAs : 'outletData',
            sheetName: OUTLET.sheetName,
            header   : OUTLET.header,
            headerRow: OUTLET.headerRow
        }, {
            returnAs : 'branchData',
            sheetName: BRANCH.sheetName,
            header   : BRANCH.header,
            headerRow: BRANCH.headerRow
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
        domainData = [],
        retailSegmentData = [],
        outletData = [],
        branchData = []
    } = workbookData;

    // import domains
    try {
        const data = yield* importDomain(domainData);

        data.sheet = LOCATION.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : LOCATION.sheetName,
            errors: [ex]
        });

        throw ex;
    }

    // import retailSegment
    try {
        const data = yield* importRetailSegment(retailSegmentData);

        data.sheet = RETAIL_SEGMENT.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : RETAIL_SEGMENT.sheetName,
            errors: [ex]
        });

        throw ex;
    }

    // import outlet
    try {
        const data = yield* importOutlet(outletData);

        data.sheet = OUTLET.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : OUTLET.sheetName,
            errors: [ex]
        });

        throw ex;
    }


    // import branch
    try {
        const data = yield* importBranch(branchData);

        data.sheet = BRANCH.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : BRANCH.sheetName,
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

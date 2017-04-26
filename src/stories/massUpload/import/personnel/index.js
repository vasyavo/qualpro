const loader = require('../utils/loadSheetFromFile');
const importPersonnel = require('./methods/importPersonnel');
const logger = require('../../../../utils/logger');
const {
    SHEETS: {
        PERSONNEL
    }
} = require('../../../../constants/import');

const loadWorkbookOptions = {
    sheets: [
        {
            returnAs : 'personnelData',
            sheetName: PERSONNEL.sheetName,
            header   : PERSONNEL.header,
            headerRow: PERSONNEL.headerRow
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
        personnelData = []
    } = workbookData;

    // import personnel
    try {
        const data = yield* importPersonnel(personnelData);

        data.sheet = PERSONNEL.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : PERSONNEL.sheetName,
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

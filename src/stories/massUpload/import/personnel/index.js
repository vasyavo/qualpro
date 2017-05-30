const loader = require('../utils/loadSheetFromFile');
const importPosition = require('./methods/importPosition');
const importPersonnel = require('./methods/importPersonnel');
const {
    SHEETS: {
        PERSONNEL,
        POSITION
    }
} = require('../../../../constants/import');

const loadWorkbookOptions = {
    sheets: [
        {
            returnAs : 'personnelData',
            sheetName: PERSONNEL.sheetName,
            header   : PERSONNEL.header,
            headerRow: PERSONNEL.headerRow
        }, {
            returnAs : 'positionData',
            sheetName: POSITION.sheetName,
            header   : POSITION.header,
            headerRow: POSITION.headerRow
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
        personnelData = [],
        positionData = [],
    } = workbookData;

    // import position
    try {
        const data = yield* importPosition(positionData);

        data.sheet = POSITION.sheetName;
        result.push(data);
    } catch (ex) {
        result.push({
            sheet : POSITION.sheetName,
            errors: [ex]
        });

        throw ex;
    }

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

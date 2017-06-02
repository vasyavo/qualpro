const XLSX = require('xlsx');

function datenum(v) {
    const epoch = Date.parse(v);
    return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}

function Workbook() {
    if (!(this instanceof Workbook)) {
        return new Workbook();
    }

    this.SheetNames = [];
    this.Sheets = {};
}

function sheetFromCollection(collection, fields) {
    const ws = {};
    const range = {s: {c: 0, r: 0}, e: {c: fields.length, r: collection.length}};

    let row = 0;
    for (const item of collection) {
        for (let column = 0; column < fields.length; column += 1) {
            const fieldName = fields[column];
            const value = item[fieldName];
            const cell = {v: value};

            if (cell.v !== null) {
                const cellRef = XLSX.utils.encode_cell({c: column, r: row});

                if (typeof cell.v === 'number') {
                    cell.t = 'n';
                } else if (typeof cell.v === 'boolean') {
                    cell.t = 'b';
                } else if (cell.v instanceof Date) {
                    cell.t = 'n';
                    // eslint-disable-next-line
                    cell.z = XLSX.SSF._table[14];
                    cell.v = datenum(cell.v);
                } else {
                    cell.t = 's';
                }

                ws[cellRef] = cell;
            }
        }

        row += 1;
    }

    ws['!ref'] = XLSX.utils.encode_range(range);
    return ws;
}

/**
 * @typedef {Object} SheetOpt
 * @property {string} sheetName - Name of the sheet.
 * @property {Array} data - Array of data that need to put to the sheet.
 * @property {Array} header - Array of output field names (keys in object) (order is important - should be the same as sheet column order).
 * @property {Object} headerRow - Object - first (header) row to the sheet.
 */

/**
 * Parse sheets from workbook and return JSON result.
 * @function
 * @param {Object} opt - An options.
 * @param {SheetOpt[]} opt.sheets - An array of sheets parsing options.
 *
 * @returns {Object} An object that contains data of each sheet
 *
 */
module.exports = function (options) {
    const {
        sheets
    } = options;

    const wb = new Workbook();

    for (const sheetOpt of sheets) {
        const {
            data,
            headerRow,
            header,
            sheetName
        } = sheetOpt;

        if (headerRow) {
            data.unshift(headerRow);
        }

        const ws = sheetFromCollection(data, header);

        wb.SheetNames.push(sheetName);
        wb.Sheets[sheetName] = ws;
    }

    return XLSX.write(wb, {bookType: 'xlsx', type: 'buffer'});
};

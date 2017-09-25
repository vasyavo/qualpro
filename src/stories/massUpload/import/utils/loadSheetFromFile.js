const XLSX = require('xlsx');
const _ = require('lodash');
const moment = require('moment');
const config = require('../../../../config');

function normalizeString(str) {
    if (typeof str === 'string') {
        return str.trim().toLowerCase();
    }

    return str;
}

function isValidSheetNames(requiredSheetNamesSet, incomingSheetNamesSet) {
    // const setIntersection = _.intersectionBy(requiredSheetNamesSet, incomingSheetNamesSet, normalizeString);
    const setIntersection = _.intersection(requiredSheetNamesSet, incomingSheetNamesSet);

    return (setIntersection.length === requiredSheetNamesSet.length);
}

/**
 * @typedef {Object} SheetOpt
 * @property {string} sheetName - Name of the sheet.
 * @property {string} returnAs - Key where to put sheet data in the output object.
 * @property {Array} header - Array of output field names (keys in object) (order is important - should be the same as sheet column order).
 * @property {Object} headerRow - Object to validate the first (header) row from the sheet.
 */

/**
 * Parse sheets from workbook and return JSON result.
 * @function
 * @param {string} filePath - A path to the workbook file.
 * @param {Object} opt - An options.
 * @param {SheetOpt[]} opt.sheets - An array of sheets parsing options.
 *
 * @returns {Object} An object that contains data of each sheet
 *
 */
module.exports = function (filePath, opt) {
    const {
        sheets
    } = opt;
    const wb = XLSX.readFile(filePath);
    const requiredSheetNamesSet = sheets.map(el => el.sheetName);
    const incomingSheetNamesSet = wb.SheetNames;

    if (!isValidSheetNames(requiredSheetNamesSet, incomingSheetNamesSet)) {
        throw new Error(`File should contain following sheets: ${requiredSheetNamesSet.join(', ') }. Please double check`);
    }

    let result = {};
    for (const sheet of sheets) {
        const {
            sheetName,
            returnAs,
            header,
            headerRow
        } = sheet;
        const incomingSheet = wb.Sheets[sheetName];
        Object.keys(incomingSheet).forEach(function(s) {
            if(incomingSheet[s].w && !moment(incomingSheet[s].w).isValid()) {
                incomingSheet[s].w = incomingSheet[s].v.toString();
            }
        });
        const jsonSheet = XLSX.utils.sheet_to_json(incomingSheet, {header}) || [];
        const firstRow = jsonSheet.shift();

        if (firstRow) {
            for (const key in headerRow) {
                if (Object.prototype.hasOwnProperty.call(headerRow, key)) {
                    if (normalizeString(headerRow[key]) !== normalizeString(firstRow[key])) {
                        const correctFormat = header.map(el => headerRow[el]);

                        throw new Error(`Sheet "${sheetName}" have incorrect header format. Should be the following: ${correctFormat.join(', ')}. Please double check.`);
                    }
                }
            }
        }

        const outKey = returnAs || normalizeString(sheetName);

        result[outKey] = jsonSheet;
    }

    return result;
};

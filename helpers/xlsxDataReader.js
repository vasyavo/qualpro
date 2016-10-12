'use strict';

var XLSX = require('xlsx');
var xlsxColumnNames = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'
];
var importMap = require('./importMap');

var read = function (fileName) {
    var workbook = XLSX.readFile(fileName);
    var collections = [];

    workbook.SheetNames.forEach(function (name) {
        var worksheet = workbook.Sheets[name];
        var objectMap = importMap[name];
        var columnMap;
        var collection;

        if (!objectMap) {
            return;
        }

        columnMap = createColumnToFieldMap(worksheet, objectMap.fields, objectMap.parsers || {});

        collection = {
            data              : readDataFrom(worksheet, columnMap),
            modelName         : objectMap.modelName,
            referenceFields   : objectMap.ref,
            relatedCollections: []
        };

        collections.push(collection);
    });

    collections.forEach(createReferences);

    return collections;
};

var createColumnToFieldMap = function (worksheet, fieldsMap, parsers) {
    var columnMap = [];
    var defaultParser = function (value) {
        return value === 'null' ? null : typeof value == 'string' ? value.trim() : value;
    };

    xlsxColumnNames.every(function (colName) {
        var cell = worksheet[colName + 1];
        var columnTitle;
        var objectProperty;

        if (cell) {
            columnTitle = cell.v;
            objectProperty = fieldsMap[columnTitle];

            if (objectProperty) {
                columnMap.push({
                    field : objectProperty,
                    column: colName,
                    parse : parsers[objectProperty] || defaultParser
                });
            }

            return true;
        }
        return false;
    });

    return columnMap;
};

var readDataFrom = function (worksheet, columnMap) {
    var allRowsAreEmpty;
    var currentRowIndex = 1;
    var dataExists;
    var modelData;
    var collection = [];

    do {
        allRowsAreEmpty = true;
        currentRowIndex++;
        modelData = {};

        columnMap.forEach(function (map) {
            var cell = worksheet[map.column + currentRowIndex];

            if (cell) {
                allRowsAreEmpty = false;
                modelData[map.field] = map.column === 'O' ? map.parse(cell.w) : map.parse(cell.v);
            }
        });

        dataExists = !allRowsAreEmpty;

        if (dataExists) {
            collection.push(modelData);
        }

    } while (dataExists);

    return collection;
};

var createReferences = function (curCollection, index, collections) {
    if (!curCollection.referenceFields) {
        return;
    }

    curCollection.referenceFields.forEach(function (field) {
        var collection = collections.find(function (collection) {
            return collection.modelName === field.model;
        });

        if (collection) {
            collection.relatedCollections.push(curCollection);
        }
    });
};

module.exports.read = read;
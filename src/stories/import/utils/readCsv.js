const fs = require('fs');
const Converter = require('csvtojson').Converter;
const config = require('./../../../config');
const whereSheets = `${config.workingDirectory}/src/import/`;
const timestamp = 'Nov_21_2016';
const createReadStream = fs.createReadStream;

const readCsv = (name, cb) => {
    const converter = new Converter({});
    const filePath = `${whereSheets}${timestamp}/${name}.csv`;

    converter.on('end_parsed', (array) => {
        cb(null, array)
    });

    createReadStream(filePath).pipe(converter);
};

module.exports = readCsv;

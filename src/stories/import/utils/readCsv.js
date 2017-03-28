const fs = require('fs');
const Converter = require('csvtojson').Converter;
const config = require('./../../../config');
const logger = require('./../../../utils/logger');

const createReadStream = fs.createReadStream;

const readCsv = (path, cb) => {
    const converter = new Converter({});
    const filePath = `${config.workingDirectory}${config.importPath}${path}.csv`;

    createReadStream(filePath).pipe(converter);

    converter.on('end_parsed', (array) => {
        cb(null, array);
    });

    fs.lstat(filePath, (err) => {
        if (err) {
            logger.info(`Skip... ${path}`);
            return cb(null, []);
        }

        logger.info(`Loading... ${path}`);
        createReadStream(filePath).pipe(converter);
    });
};

module.exports = readCsv;

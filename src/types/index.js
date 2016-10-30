const fs = require('fs');
const path = require('path');
const async = require('async');

async.waterfall([

    (cb) => {
        const folderWithTypes = path.join(__dirname, './');

        fs.readdir(folderWithTypes, cb);
    },

    (files, cb) => {
        files.forEach((fileTitle) => {
            fileTitle !== 'index.js' ?
                require(path.join(__dirname, fileTitle, '/model.js')) : null;
        });
        cb();
    }

]);

module.exports = {};

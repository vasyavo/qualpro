const fs = require('fs');
const path = require('path');
const async = require('async');
const config = require('./../config');

const paths = [
    path.join(config.workingDirectory, 'src/public/js/libs/Jcrop/css/jquery.Jcrop.min.css'),
    path.join(config.workingDirectory, 'src/public/js/libs/jquery-ui/themes/base/jquery-ui.min.css'),
    path.join(config.workingDirectory, 'src/public/js/libs/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.min.css'),
];

module.exports = (callback) => {
    async.map(paths, (pathToStyle, cb) => {
        fs.readFile(pathToStyle, { encoding: 'utf-8' }, (err, data) => {
            if (err) {
                return cb(err);
            }

            cb(null, { body: data });
        });
    }, (err, results) => {
        if (err) {
            return callback(err);
        }

        callback(null, results);
    });
};

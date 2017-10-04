const fs = require('fs');
const path = require('path');
const async = require('async');
const handlebars = require('handlebars');

const config = require('./../config');
const readStyles = require('./readStyles');

module.exports = (req, res, next) => {
    async.parallel({

        template: (cb) => {
            const pathToTemplate = path.join(config.workingDirectory, 'src/public/dist/index.html');

            fs.readFile(pathToTemplate, { encoding: 'utf-8' }, (err, data) => {
                if (err) {
                    return cb(err);
                }

                cb(null, data);
            });
        },

        styles: async.apply(readStyles),

    }, (err, result) => {
        if (err) {
            return next(err);
        }

        const options = {
            csrfToken: req.csrfToken(),
            pubnubSubscribeKey: config.pubnub.subscribeKey,
            previewUrlRoot: config.previewUrlRoot,
            styles: result.styles,
        };

        const body = handlebars.compile(result.template)(options);

        res.status(200);
        res.set('Content-Type', 'text/html');
        res.send(body);
    });
};

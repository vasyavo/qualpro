const mongoose = require('mongoose');
const _ = require('lodash');
const async = require('async');
const config = require('./../config');
const mongo = require('./../utils/mongo');
const logger = require('./../utils/logger');

mongoose.Schemas = {};
const PersonnelModel = require('./../types/personnel/model');

const toLowerCasePersonnelEmail = () => {
    async.waterfall([

        (cb) => {
            PersonnelModel.find({}, cb);
        },

        (models, cb) => {
            async.eachLimit(models, 10, (model, eachCb) => {
                const currentEmail = model.get('email');

                if (!_.isString(currentEmail)) {
                    return eachCb(null);
                }

                const lowerCaseEmail = currentEmail.toLowerCase()

                model.set('email', lowerCaseEmail);
                model.save((err, updatedModel, numAffected) => {
                    eachCb(err);
                });
            }, cb);
        }

    ], (err) => {
        if (err) {
            logger.error('Something went wrong...', err);
            return;
        }

        logger.info('Ready.')
    });
};

toLowerCasePersonnelEmail();

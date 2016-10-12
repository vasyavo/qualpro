var dataImporter = function (db) {
    var saveNextCollection;
    var xlsxDataReader = require('./xlsxDataReader');
    var async = require('async');
    var mongoose = require('mongoose');
    var importMap = require('./importMap');
    var collections;
    var startCollections;
    var collectionsFromDb = {};
    var _ = require('lodash');

    //todo callback fires only on success. Fire it on failure
    var importFromFile = function (fileName, callback) {
        collections = xlsxDataReader.read(fileName);
        startCollections = collections.slice();

        saveNextCollection(collections, callback);
    };

    var saveNextCollection = function (collections, callback) {
        var saving;

        if (collections.length === 0) {
            console.log('Import done');
            return callback(true);
        }

        saving = collections.shift();
        console.log('Saving: ' + saving.modelName);
        save(saving, saveNextCollection.bind(null, collections, callback));
    };

    var save = function (collection, cb) {
        var Model = db.model(collection.modelName, mongoose.Schemas[collection.modelName]);

        var updateData = function (data) {
            var unsavedData = [];
            var modelsToSave = [];
            var refFields = collection.referenceFields;

            if (data.length === 0) {
                return cb();
            }

            function getCollection(options, waterFallCb) {
                var field = options.field;
                var model = field.model;
                var SearchModel = db.model(model, mongoose.Schemas[model]);
                //var query = type ? {type: type} : {};

                SearchModel
                    .find()
                    .exec(function (err, result) {
                        if (err) {
                            return waterFallCb(err);
                        }

                        collectionsFromDb[model] = result;

                        options.result = result;

                        waterFallCb(null, options);
                    });
            }

            function setValuesToRefs(options, waterFallCb) {
                var field = options.field;
                var modelData = options.modelData;
                var result = options.result;
                var fieldName = field.name;
                var type = field.type;
                var idAttribute = field.idAttribute || 'ID';
                var fieldValue = modelData[fieldName];
                var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

                var correctRow;

                result = _.map(result, function (el) {
                    return el.toObject();
                });

                function getValue(value, type) {
                    var findWhereQuery = {};

                    if (value && !checkForHexRegExp.test(value)) {
                        findWhereQuery.setNestedProperty(idAttribute, value);

                        if (type) {
                            findWhereQuery.type = type;
                        }

                        correctRow = _.find(result, findWhereQuery);

                        if (correctRow) {
                            return correctRow._id.toString();
                        } else {
                            return console.dir(findWhereQuery);
                        }
                    } else {
                        return value;
                    }
                }

                if (fieldValue instanceof Array) {
                    modelData[fieldName] = _.map(fieldValue, function(el) {
                       return getValue(el, type);
                    });
                } else {
                    modelData[fieldName] = getValue(fieldValue, type);
                }

                waterFallCb(null, modelData);
            }

            async.eachSeries(data, function (modelData, callBack) {
                if (refFields && refFields.length) {
                    async.eachSeries(refFields, function (field, asyncCB) {
                        var model = field.model;
                        var waterFallTasks = [];
                        var startCollectionsRowIndex = _.findIndex(startCollections, {modelName: model});

                        if (startCollectionsRowIndex === -1) {
                            if (!collectionsFromDb[model]) {
                                waterFallTasks.push(async.apply(getCollection, {
                                    field    : field,
                                    modelData: modelData
                                }));
                                waterFallTasks.push(setValuesToRefs);
                            } else {
                                waterFallTasks.push(async.apply(setValuesToRefs, {
                                    result   : collectionsFromDb[model],
                                    field    : field,
                                    modelData: modelData
                                }));
                            }
                        } else {
                            return asyncCB();
                        }

                        async.waterfall(waterFallTasks, function (err, result) {
                            if (err) {
                                return asyncCB(err);
                            }
                            asyncCB();
                        });
                    }, function (err) {
                        if (err) {
                            return callBack(err);
                        }

                        if (hasNoDependencies(modelData, refFields)) {
                            modelsToSave.push({
                                modelName         : collection.modelName,
                                model             : new Model(modelData),
                                relatedCollections: collection.relatedCollections
                            });
                        } else {
                            unsavedData.push(modelData);
                        }

                        async.setImmediate(function () {
                            callBack();
                        });
                    });
                } else {

                    if (hasNoDependencies(modelData, refFields)) {
                        modelsToSave.push({
                            modelName         : collection.modelName,
                            model             : new Model(modelData),
                            relatedCollections: collection.relatedCollections
                        });
                    } else {
                        unsavedData.push(modelData);
                    }
                    async.setImmediate(function () {
                        callBack();
                    });
                }
            }, function (err) {
                if (err) {
                    return console.dir(err);
                }

                if (!modelsToSave.length) {
                    unsavedData = _.map(unsavedData, function (el) {
                        return el.ID;
                    });

                    console.log(unsavedData);
                    console.log('No model was saved');
                } else {
                    async.each(modelsToSave, saveDataAndUpdateDependencies, function (err) {
                        if (err) {
                            return console.dir(err);
                        }

                        updateData(unsavedData);
                    });
                }
            });
        };

        updateData(collection.data);
    };

    var saveDataAndUpdateDependencies = function (options, callback) {
        options.model.save(function (err, resp) {
            if (err) {
                return callback(err);
            }

            options.relatedCollections.forEach(function (relatedCollection) {
                relatedCollection.data.forEach(function (element) {
                    relatedCollection.referenceFields.forEach(function (field) {

                        var ref = field.idAttribute || 'ID';

                        if (options.modelName === field.model) {
                            if (!field.type || (resp.type && field.type === resp.type)) {
                                updateReference(resp._id.toString(), element, field.name, resp.getNestedProperty(ref));
                            }
                        }
                    });
                });
            });

            callback();
        });
    };

    var updateReference = function (id, element, fieldName, referenceField) {
        var field = element[fieldName];
        var index;

        if (field instanceof Array) {
            index = field.indexOf(referenceField);

            if (index >= 0) {
                field[index] = id;
            }

            return;
        }

        if (element[fieldName] == referenceField) {//int and string comparison e.g 1 and "1"
            element[fieldName] = id;
        }
    };

    var isRealObjectId = function (str) {

        return typeof str === 'string' && str.match(/^[0-9a-fA-F]{24}$/) || (str.id);
    };

    var hasNoDependencies = function (modelData, referenceFields) {
        if (!referenceFields) {
            return true;
        }

        return referenceFields.every(function (field) {
            var value = modelData[field.name];

            //console.dir(modelData);

            return fieldIsNotDependency(value);
        });

    };

    var fieldIsNotDependency = function (fieldValue) {
        if (!fieldValue) {
            return true;
        }

        if (fieldValue instanceof Array) {
            return fieldValue.every(function (el) {
                return isRealObjectId(el);
            });
        }

        return isRealObjectId(fieldValue);
    };

    return {importFromFile: importFromFile};
};

module.exports = dataImporter;
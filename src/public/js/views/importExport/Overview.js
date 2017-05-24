define(function (require) {

    var Marionette = require('marionette');
    var PubNubClient = require('services/pubnub');
    var ImportErrorsView = require('views/importExport/ImportErrors');
    var Template = require('text!templates/importExport/overview.html');
    var MS_EXEL_CONTENT_TYPES = require('constants/otherConstants').MS_EXCEL_CONTENT_TYPES;
    var ERROR_MESSAGES = require('constants/errorMessages');
    var INFO_MESSAGES = require('constants/InfoMessages');

    require('dropzone');

    return Marionette.View.extend({

        initialize: function (options) {
            this.translation = options.translation;

            App.EventBus.off('import-finished');
            App.EventBus.on('import-finished', this.onImportFinished, this);
        },

        className: 'row import-buttons',

        template: function (ops) {
            return _.template(Template)(ops);
        },

        onImportFinished: function (response) {
            var that = this;
            var currentLanguage = App.currentUser.currentLanguage;

            App.$preLoader.fadeFn({
                visibleState: false
            });

            if (response.rootError) {
                App.renderErrors([
                    response.rootError,
                ]);
                return;
            }

            if (response.totalErrors) {
                this.importErrorsView = new ImportErrorsView({
                    translation: that.translation,
                    models     : response.result,
                });
            } else {
                App.render({
                    type   : 'notification',
                    message: INFO_MESSAGES.fileSuccessfullyImported[currentLanguage],
                });
            }
        },

        templateContext: function () {
            return {
                translation: this.translation,
            };
        },

        ui: {
            locations                : '#locations',
            personnels               : '#personnels',
            itemPrices               : '#item-prices',
            competitorList           : '#competitor-list',
            locationsButtonTitle     : '#locations-button-title',
            personnelsButtonTitle    : '#personnels-button-title',
            itemPricesButtonTitle    : '#item-prices-button-title',
            competitorListButtonTitle: '#competitor-list-button-title',
        },

        events: {
            'click @ui.locations'     : 'exportLocations',
            'click @ui.personnels'    : 'exportPersonnels',
            'click @ui.itemPrices'    : 'exportItemPrices',
            'click @ui.competitorList': 'exportCompetitorList',
        },

        exportLocations: function () {
            var model = this.model;
            var action = model.get('action');

            if (action === 'export') {
                model.exportData('locations');
            }
        },

        exportPersonnels: function () {
            var model = this.model;
            var action = model.get('action');

            if (action === 'export') {
                model.exportData('personnels');
            }
        },

        exportItemPrices: function () {
            var model = this.model;
            var action = model.get('action');

            if (action === 'export') {
                model.exportData('items');
            }
        },

        exportCompetitorList: function () {
            var model = this.model;
            var action = model.get('action');

            if (action === 'export') {
                model.exportData('competitor-items');
            }
        },

        onRender: function () {
            var that = this;
            var ui = this.ui;
            var currentLanguage = App.currentUser.currentLanguage;

            ui.locations.dropzone({
                url              : 'import/locations?channel=' + App.currentDeviceChannel,
                paramName        : 'source',
                maxFilesize      : 5,
                uploadMultiple   : false,
                previewsContainer: false,
                accept           : function (file, done) {
                    if (!MS_EXEL_CONTENT_TYPES.includes(file.type)) {
                        var errorMessage = ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage];

                        App.renderErrors([
                            errorMessage,
                        ]);

                        return done(errorMessage);
                    }

                    App.$preLoader.fadeFn({
                        visibleState: true,
                        transparent: true
                    });

                    done();
                },
                error            : function (file, error) {
                    App.renderErrors([
                        error.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                    ]);
                }
            });

            ui.personnels.dropzone({
                url              : 'import/personnels?channel=' + App.currentDeviceChannel,
                paramName        : 'source',
                maxFilesize      : 5,
                uploadMultiple   : false,
                previewsContainer: false,
                accept           : function (file, done) {
                    if (!MS_EXEL_CONTENT_TYPES.includes(file.type)) {
                        var errorMessage = ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage];

                        App.renderErrors([
                            errorMessage,
                        ]);

                        return done(errorMessage);
                    }

                    App.$preLoader.fadeFn({
                        visibleState: true,
                        transparent: true
                    });

                    done();
                },
                error            : function (file, error) {
                    App.renderErrors([
                        error.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                    ]);
                }
            });

            ui.itemPrices.dropzone({
                url              : 'import/items?channel=' + App.currentDeviceChannel,
                paramName        : 'source',
                maxFilesize      : 5,
                uploadMultiple   : false,
                previewsContainer: false,
                accept           : function (file, done) {
                    if (!MS_EXEL_CONTENT_TYPES.includes(file.type)) {
                        var errorMessage = ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage];

                        App.renderErrors([
                            errorMessage,
                        ]);

                        return done(errorMessage);
                    }

                    App.$preLoader.fadeFn({
                        visibleState: true,
                        transparent: true
                    });

                    done();
                },
                error            : function (file, error) {
                    App.renderErrors([
                        error.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                    ]);
                }
            });

            ui.competitorList.dropzone({
                url              : 'import/competitor-items?channel=' + App.currentDeviceChannel,
                paramName        : 'source',
                maxFilesize      : 5,
                uploadMultiple   : false,
                previewsContainer: false,
                accept           : function (file, done) {
                    if (!MS_EXEL_CONTENT_TYPES.includes(file.type)) {
                        var errorMessage = ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage];

                        App.renderErrors([
                            errorMessage,
                        ]);

                        return done(errorMessage);
                    }

                    App.$preLoader.fadeFn({
                        visibleState: true,
                        transparent: true
                    });

                    done();
                },
                error            : function (file, error) {
                    App.renderErrors([
                        error.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                    ]);
                }
            });
        },

        modelEvents: {
            'action:changed': 'actionChanged',
        },

        actionChanged: function () {
            var ui = this.ui;
            var translation = this.translation;
            var action = this.model.get('action');

            if (action === 'export') {
                ui.locations[0].dropzone.disable();
                ui.personnels[0].dropzone.disable();
                ui.itemPrices[0].dropzone.disable();
                ui.competitorList[0].dropzone.disable();

                ui.locationsButtonTitle.html(translation.exportLocationsTitle);
                ui.personnelsButtonTitle.html(translation.exportPersonnelTitle);
                ui.itemPricesButtonTitle.html(translation.exportItemsPricesTitle);
                ui.competitorListButtonTitle.html(translation.exportCompetitorListTitle);
            } else {
                ui.locations[0].dropzone.enable();
                ui.personnels[0].dropzone.enable();
                ui.itemPrices[0].dropzone.enable();
                ui.competitorList[0].dropzone.enable();

                ui.locationsButtonTitle.html(translation.importLocationsTitle);
                ui.personnelsButtonTitle.html(translation.importPersonnelTitle);
                ui.itemPricesButtonTitle.html(translation.importItemsPricesTitle);
                ui.competitorListButtonTitle.html(translation.importCompetitorListTitle);
            }
        }

    });

});

define(function (require) {

    var Marionette = require('marionette');
    var ImportErrorsView = require('views/importExport/ImportErrors');
    var Template = require('text!templates/importExport/overview.html');
    var MS_EXEL_CONTENT_TYPES = require('constants/otherConstants').MS_EXCEL_CONTENT_TYPES;
    var ERROR_MESSAGES = require('constants/errorMessages');
    var INFO_MESSAGES = require('constants/infoMessages');

    require('dropzone');

    return Marionette.View.extend({

        initialize: function (options) {
            this.translation = options.translation;
        },

        className: 'row import-buttons',

        template: function (ops) {
            return _.template(Template)(ops);
        },

        templateContext: function () {
            return {
                translation: this.translation,
            };
        },

        ui: {
            locations: '#locations',
            personnels: '#personnels',
            itemPrices: '#item-prices',
            competitorList: '#competitor-list',
            locationsButtonTitle: '#locations-button-title',
            personnelsButtonTitle: '#personnels-button-title',
            itemPricesButtonTitle: '#item-prices-button-title',
            competitorListButtonTitle: '#competitor-list-button-title',
        },

        events: {
            'click @ui.locations': 'exportLocations',
            'click @ui.personnels': 'exportPersonnels',
            'click @ui.itemPrices': 'exportItemPrices',
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
                model.exportData('itemPrices');
            }
        },

        exportCompetitorList: function () {
            var model = this.model;
            var action = model.get('action');

            if (action === 'export') {
                model.exportData('competitorList');
            }
        },

        onRender: function () {
            var that = this;
            var ui = this.ui;
            var currentLanguage = App.currentUser.currentLanguage;

            ui.locations.dropzone({
                url: 'import/locations',
                paramName: 'source',
                maxFilesize: 5,
                uploadMultiple: false,
                previewsContainer: false,
                accept: function (file, done) {
                    if (!MS_EXEL_CONTENT_TYPES.includes(file.type)) {
                        var errorMessage = ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage];

                        App.renderErrors([
                            errorMessage,
                        ]);

                        return done(errorMessage);
                    }

                    done();
                },
                success: function (file, response) {
                    response.totalErrors = 1;
                    if (response.totalErrors) {
                        this.importErrorsView = new ImportErrorsView({
                            translation: that.translation,
                        });
                    } else {
                        App.render({
                            type: 'notification',
                            message: INFO_MESSAGES.fileSuccessfullyImported[currentLanguage],
                        });
                    }
                },
                error: function (file, error) {
                    App.renderErrors([
                        error.message || ERROR_MESSAGES.somethingWentWrong[currentLanguage],
                    ]);
                }
            });

            ui.personnels.dropzone({
                url: 'import/personnels',
                paramName: 'file',
                maxFilesize: 5,
                uploadMultiple: false,
                previewsContainer: false,
                accept: function (file, done) {
                    if (!MS_EXEL_CONTENT_TYPES.includes(file.type)) {
                        var errorMessage = ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage];

                        App.renderErrors([
                            errorMessage,
                        ]);

                        return done(errorMessage);
                    }

                    done();
                }
            });

            ui.itemPrices.dropzone({
                url: 'import/itemPrices',
                paramName: 'file',
                maxFilesize: 5,
                uploadMultiple: false,
                previewsContainer: false,
                accept: function (file, done) {
                    if (!MS_EXEL_CONTENT_TYPES.includes(file.type)) {
                        var errorMessage = ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage];

                        App.renderErrors([
                            errorMessage,
                        ]);

                        return done(errorMessage);
                    }

                    done();
                }
            });

            ui.competitorList.dropzone({
                url: 'import/competitorList',
                paramName: 'file',
                maxFilesize: 5,
                uploadMultiple: false,
                previewsContainer: false,
                accept: function (file, done) {
                    if (!MS_EXEL_CONTENT_TYPES.includes(file.type)) {
                        var errorMessage = ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage];

                        App.renderErrors([
                            errorMessage,
                        ]);

                        return done(errorMessage);
                    }

                    done();
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

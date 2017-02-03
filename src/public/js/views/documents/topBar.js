define(function (require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('Backbone');
    var Marionette = require('marionette');
    var CreateFileView = require('views/documents/createFile');
    var CreateFolderView = require('views/documents/createFolder');
    var CONTENT_TYPES = require('constants/contentType');
    var Template = require('text!templates/documents/topBar.html');

    return Marionette.View.extend({

        initialize : function (options) {
            this.translation = options.translation;
        },

        template : function (ops) {
            return _.template(Template)(ops);
        },

        templateContext: function () {
            return {
                translation: this.translation,
                filterForArchivedTab : JSON.stringify(this.additionalVariables.filterForArchivedTab)
            };
        },

        ui : {
            actionHolder : '#actionHolder',
            checkAll : '#check-all',
            checkboxArea : '#checkbox-area',
            actionsDropdown : '#actions-dropdown',
            archivedTab : '#archived-tab',
            unarchivedTab : '#unarchived-tab',
            createFile : '#create-file',
            createFolder : '#create-folder'
        },

        events : {
            'click @ui.checkAll' : 'checkAllItems',
            'click @ui.actionHolder' : 'openActions',
            'click @ui.archivedTab' : 'goToArchivedTab',
            'click @ui.unarchivedTab' : 'goToUnarchivedTab',
            'click @ui.createFile' : 'showCreateFileView'
        },

        checkAllItems : function (event) {
            var checked = event.target.checked;

            this.changeActionHolderState(checked);

            this.collection.checked = this.collection.models.map(function (model) {
                if (checked) {
                    model.trigger('item:check');
                    return model.get('_id');
                } else {
                    model.trigger('item:uncheck');
                    return null;
                }
            }).filter(function (item) {
                return item;
            });
        },

        openActions : function () {
            this.ui.actionsDropdown.toggleClass('showActionsDropDown');
        },

        goToArchivedTab : function () {
            var ui = this.ui;

            if (!ui.archivedTab.hasClass('viewBarTabActive')) {
                ui.archivedTab.addClass('viewBarTabActive');
                ui.unarchivedTab.removeClass('viewBarTabActive');

                ui.createFile.addClass('hidden');
                ui.createFolder.addClass('hidden');

                this.unselectAllItems();

                var filterForArchivedTab = this.additionalVariables.filterForArchivedTab;
                var collection = this.collection;
                collection.url = CONTENT_TYPES.DOCUMENTS + '?' + $.param(filterForArchivedTab);
                collection.fetch();

                Backbone.history.navigate('qualPro/' + CONTENT_TYPES.DOCUMENTS + '/' + JSON.stringify(filterForArchivedTab));
            }
        },

        goToUnarchivedTab : function () {
            var ui = this.ui;

            if (!ui.unarchivedTab.hasClass('viewBarTabActive')) {
                ui.archivedTab.removeClass('viewBarTabActive');
                ui.unarchivedTab.addClass('viewBarTabActive');

                ui.createFile.removeClass('hidden');
                ui.createFolder.removeClass('hidden');

                this.unselectAllItems();

                var collection = this.collection;
                collection.url = CONTENT_TYPES.DOCUMENTS;
                collection.fetch();

                Backbone.history.navigate('qualPro/' + CONTENT_TYPES.DOCUMENTS);
            }
        },

        showCreateFileView : function () {
            new CreateFileView({
                translation : this.translation
            });
        },

        collectionEvents : {
            'item:checked' : 'itemChecked',
            'sync' : 'whetherOrNotShowSelectAllButton'
        },

        itemChecked : function () {
            var arrayOfCheckedValues = this.collection.checked;
            var valuesCount = arrayOfCheckedValues.length;

            this.changeActionHolderState(valuesCount);

            if (valuesCount === this.collection.length) {
                this.ui.checkAll.prop('checked', true);
            } else {
                this.ui.checkAll.prop('checked', false);
            }
        },

        whetherOrNotShowSelectAllButton : function () {
            if (this.collection.length) {
                this.ui.checkboxArea.removeClass('hidden');
            } else {
                this.ui.checkboxArea.addClass('hidden');
            }
        },

        changeActionHolderState : function (condition) {
            if (condition) {
                this.ui.actionHolder.removeClass('hidden');
            } else {
                this.ui.actionHolder.addClass('hidden');
            }
        },

        unselectAllItems : function () {
            var ui = this.ui;

            this.collection.checked = [];

            ui.actionHolder.addClass('hidden');
            ui.checkAll.prop('checked', false);
        },

        additionalVariables : {
            filterForArchivedTab : {
                filter : {
                    archived : {
                        type : 'boolean',
                        values : [true]
                    }
                }
            }
        }

    });

});

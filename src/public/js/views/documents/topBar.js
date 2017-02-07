define(function (require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('Backbone');
    var Marionette = require('marionette');
    var CreateFileView = require('views/documents/createFile');
    var CreateFolderView = require('views/documents/createFolder');
    var DocumentsModel = require('models/documents');
    var CONTENT_TYPES = require('constants/contentType');
    var Template = require('text!templates/documents/topBar.html');

    return Marionette.View.extend({

        initialize : function (options) {
            this.translation = options.translation;
            this.archived = options.archived;
        },

        template : function (ops) {
            return _.template(Template)(ops);
        },

        templateContext: function () {
            return {
                translation: this.translation
            };
        },

        onRender : function () {
            if (this.archived) {
                this.switchUIToArchiveTab();
            } else {
                this.ui.unArchiveButton.addClass('hidden');
            }
        },

        ui : {
            actionHolder : '#actionHolder',
            checkAll : '#check-all',
            checkboxArea : '#checkbox-area',
            actionsDropdown : '#actions-dropdown',
            archivedTab : '#archived-tab',
            unarchivedTab : '#unarchived-tab',
            createFile : '#create-file',
            createFolder : '#create-folder',
            archiveButton : '#archive',
            unArchiveButton : '#unarchive',
            delete : '#delete',
            copy : '#copy',
            cut : '#cut',
            paste : '#paste'
        },

        events : {
            'click @ui.checkAll' : 'checkAllItems',
            'click @ui.actionHolder' : 'openActions',
            'click @ui.archivedTab' : 'goToArchivedTab',
            'click @ui.unarchivedTab' : 'goToUnarchivedTab',
            'click @ui.createFile' : 'showCreateFileView',
            'click @ui.createFolder' : 'showCreateFolderView',
            'click @ui.delete' : 'deleteItems',
            'click @ui.archiveButton' : 'archiveItems',
            'click @ui.unArchiveButton' : 'unArchiveItems',
            'click @ui.cut' : 'cut',
            'click @ui.copy' : 'copy',
            'click @ui.paste' : 'paste',
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
            if (!this.ui.archivedTab.hasClass('viewBarTabActive')) {
                this.switchUIToArchiveTab();
                this.unselectAllItems();

                this.archived = true;

                var collection = this.collection;
                collection.folder = null;
                collection.url = CONTENT_TYPES.DOCUMENTS + '/folder?archived=true';
                collection.fetch();

                Backbone.history.navigate('qualPro/' + CONTENT_TYPES.DOCUMENTS + '/filter={"archived":true}');
            }
        },

        goToUnarchivedTab : function () {
            var ui = this.ui;

            if (!ui.unarchivedTab.hasClass('viewBarTabActive')) {
                var hidden = 'hidden';

                ui.archivedTab.removeClass('viewBarTabActive');
                ui.unarchivedTab.addClass('viewBarTabActive');

                ui.createFile.removeClass(hidden);
                ui.createFolder.removeClass(hidden);

                ui.archiveButton.removeClass(hidden);
                ui.unArchiveButton.addClass(hidden);

                ui.copy.removeClass(hidden);
                ui.cut.removeClass(hidden);
                ui.paste.removeClass(hidden);

                this.archived = false;

                this.unselectAllItems();

                var collection = this.collection;
                collection.folder = null;
                collection.url = CONTENT_TYPES.DOCUMENTS + '/folder';
                collection.fetch();

                Backbone.history.navigate('qualPro/' + CONTENT_TYPES.DOCUMENTS);
            }
        },

        switchUIToArchiveTab : function () {
            var ui = this.ui;
            var hidden = 'hidden';

            ui.archivedTab.addClass('viewBarTabActive');
            ui.unarchivedTab.removeClass('viewBarTabActive');

            ui.createFile.addClass(hidden);
            ui.createFolder.addClass(hidden);

            ui.archiveButton.addClass(hidden);
            ui.unArchiveButton.removeClass(hidden);

            ui.copy.addClass(hidden);
            ui.cut.addClass(hidden);
            ui.paste.addClass(hidden);
        },

        showCreateFileView : function () {
            var that = this;

            this.createFileView = new CreateFileView({
                translation : this.translation
            });

            this.createFileView.on('file:saved', function (savedData) {
                var model = new DocumentsModel(savedData);

                that.collection.add(model);
                that.collection.trigger('sync');
            });
        },

        showCreateFolderView : function () {
            var that = this;

            this.createFileView = new CreateFolderView({
                translation : this.translation
            });

            this.createFileView.on('file:saved', function (savedData) {
                var model = new DocumentsModel(savedData);

                that.collection.add(model);
                that.collection.trigger('sync');
            });
        },

        deleteItems : function () {
            this.collection.deleteItems();
        },

        archiveItems : function () {
            this.collection.archiveItems(true);
        },

        unArchiveItems : function () {
            this.collection.archiveItems(false);
        },

        cut : function () {
            var cuttedOrCopied = this.collection.cuttedOrCopied;

            cuttedOrCopied.action = 'cut';
            cuttedOrCopied.from = this.collection.folder;
            cuttedOrCopied.ids = [].concat(this.collection.checked);

            this.ui.paste.removeClass('hidden');
        },

        copy : function () {
            var cuttedOrCopied = this.collection.cuttedOrCopied;

            cuttedOrCopied.action = 'copy';
            cuttedOrCopied.from = this.collection.folder;
            cuttedOrCopied.ids = [].concat(this.collection.checked);

            this.ui.paste.removeClass('hidden');
        },

        paste : function () {
            this.collection.moveItems();
        },

        collectionEvents : {
            'item:checked' : 'itemChecked',
            'sync' : 'onCollectionSync'
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

        onCollectionSync : function () {
            this.whetherOrNotShowSelectAllButton();
            this.whetherOrNotShowPasteButton();
        },

        whetherOrNotShowSelectAllButton : function () {
            if (this.collection.length) {
                this.ui.checkboxArea.removeClass('hidden');
            } else {
                this.ui.checkboxArea.addClass('hidden');
            }
        },

        whetherOrNotShowPasteButton : function () {
            var cuttedOrCopied = this.collection.cuttedOrCopied;

            if (!this.archived && Object.keys(cuttedOrCopied).length && cuttedOrCopied.ids.length) {
                this.ui.actionHolder.removeClass('hidden');
                this.ui.paste.removeClass('hidden');
            } else {
                this.ui.paste.addClass('hidden');
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
        }

    });

});

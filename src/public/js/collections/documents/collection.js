define(function (require) {

    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('Backbone');
    var Model = require('models/documents');
    var CONTENT_TYPES = require('constants/contentType');

    return Backbone.Collection.extend({

        initialize : function () {
            this.on('sync', function () {
                this.checked = [];
            });
        },

        state : {
            pageSize : 25,
            totalRecords : null,
            totalPages : null
        },

        queryParams : {
            pageSize : 'count'
        },

        model : Model,

        checked : [],

        cuttedOrCopied : {},

        url : CONTENT_TYPES.DOCUMENTS + '/folder',

        parse : function (response) {
            return response.data;
        },

        parseState : function (response) {
            return {
                totalRecords : response.total,
                totalPages : Math.ceil(response.total / this.state.pageSize)
            };
        },

        deleteItems : function () {
            var that = this;
            var checked = this.checked;

            if (!checked) {
                return;
            }

            $.ajax({
                url : CONTENT_TYPES.DOCUMENTS + '/delete',
                type : 'PATCH',
                data : JSON.stringify({
                    ids : checked
                }),
                contentType: 'application/json',
                success : function () {
                    that.remove(that.checked);

                    that.trigger('sync');
                },
                error : function (err) {
                    var currentLanguage = App.currentUser.currentLanguage;
                    var errDescription = err.responseJSON.description;

                    App.render({
                        type : 'error',
                        message : errDescription[currentLanguage]
                    });
                }
            });
        },

        archiveItems : function (value) {
            var that = this;
            var checked = this.checked;

            if (!checked) {
                return;
            }

            $.ajax({
                url : CONTENT_TYPES.DOCUMENTS + '/archive',
                type : 'PATCH',
                data : JSON.stringify({
                    ids : checked,
                    archive : value
                }),
                contentType: 'application/json',
                success : function () {
                    that.remove(checked);

                    that.trigger('sync');
                },
                error : function (err) {
                    var currentLanguage = App.currentUser.currentLanguage;
                    var errDescription = err.responseJSON.description;

                    App.render({
                        type : 'error',
                        message : errDescription[currentLanguage]
                    });
                }
            });
        },

        moveItems : function () {
            var that = this;
            var cuttedOrCopied = this.cuttedOrCopied;

            if (!Object.keys(cuttedOrCopied).length || !cuttedOrCopied.ids.length || (this.folder === cuttedOrCopied.from && cuttedOrCopied.action === 'cut')) {
                return;
            }

            if (this.folder) {
                cuttedOrCopied.parent = this.folder;
                delete cuttedOrCopied.from;
            }

            $.ajax({
                url : CONTENT_TYPES.DOCUMENTS + '/move',
                type : 'PATCH',
                data : JSON.stringify(cuttedOrCopied),
                contentType: 'application/json',
                success : function (response) {
                    delete cuttedOrCopied.ids;
                    delete cuttedOrCopied.from;
                    delete cuttedOrCopied.parent;
                    delete cuttedOrCopied.action;

                    that.reset(response.data);

                    that.trigger('sync');
                },
                error : function (err) {
                    var currentLanguage = App.currentUser.currentLanguage;
                    var errDescription = err.responseJSON.description;

                    App.render({
                        type : 'error',
                        message : errDescription[currentLanguage]
                    });
                }
            });
        }

    });

});
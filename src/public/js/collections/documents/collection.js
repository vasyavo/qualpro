define(function (require) {

    var $ = require('jquery');
    var PageableCollection = require('backbone.paginator');
    var Model = require('models/documents');
    var CONTENT_TYPES = require('constants/contentType');

    return PageableCollection.extend({

        initialize : function () {
            this.on('sync', function () {
                this.checked = [];
            });
        },

        model : Model,

        checked : [],

        url : CONTENT_TYPES.DOCUMENTS + '/folder',

        parse : function (response) {
            return response.data;
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

        archiveItems : function (type) {
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
                    type : type,
                    parent : null
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
        }

    });

});
define(function (require) {

    var Backbone = require('Backbone');
    var Model = require('models/documents');
    var CONTENT_TYPES = require('constants/contentType');

    require('backbone.paginator');

    return Backbone.Collection.extend({

        model : Model,

        checked : [],

        url : CONTENT_TYPES.DOCUMENTS + '/folder',

        parse : function (response) {
            return response.data;
        }

    });

});
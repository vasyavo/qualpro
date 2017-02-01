define([
    'Backbone',
    'models/documents',
    'constants/contentType'
], function (Backbone, Model, CONTENT_TYPES) {

    return Backbone.Collection.extend({

        model : Model,

        checked : [],

        url : CONTENT_TYPES.DOCUMENTS,

        parse : function (response) {
            return response.data;
        }

    });

});
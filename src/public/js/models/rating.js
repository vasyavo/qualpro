define([
    'backbone',
    'moment',
    'validation'
], function (Backbone, moment, validation) {
    var Model = Backbone.Model.extend({
        idAttribute: '_id',

        initialize: function (options) {
            if (this.collection && this.collection.contentType) {
                this.contentType = this.collection.contentType;
            } else if (options && options.contentType) {
                this.contentType = options.contentType;
            } else {
                this.contentType = 'monthly';
            }
        },

        fieldsToTranslate: [
            'target',
            'achiev',
            'rating'
        ],

        urlRoot: function () {
            return '/rating/' + this.contentType;
        },

        parse   : function (response) {
            response.monthLong = response.month ? moment().set('month', response.month - 1).format('MMMM') : '';
            response.timeFirstCaps = response.time ? response.time.capitalizer('firstCaps') : '';

            return response;
        }
    });

    return Model;
});

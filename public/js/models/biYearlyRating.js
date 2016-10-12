define([
        'Backbone',
        'Underscore',
        'helpers/createDefaultBiYearlyRatingDetails'
    ],
    function (Backbone, _, createDefaultBiYearlyRatingDetails) {
        var Model = Backbone.Model.extend({
            idAttribute: '_id',

            initialize: function (options) {
                options = options || {};

                var translation = options.translation || {};

                this.set({details: createDefaultBiYearlyRatingDetails(translation), rating: 0});
            },

            setRatingsToModel: function (modelWithRatings) {
                var modelJson = modelWithRatings.toJSON();
                var details = this.get('details');
                var option;

                for (var key in details) {

                    if (details[key].type === 'text') {
                        details[key].result = modelJson[key];
                    }

                    if (details[key].type === 'table') {
                        details[key].result = modelJson[key].result;

                        _.map(details[key].groups, function (group, firstIndex) {
                            _.map(group, function (rateObject, secondIndex) {
                                rateObject.value = modelJson[key][rateObject.id];
                            });
                        });
                    }

                    if (details[key].type === 'singleSelect') {
                        option = _.where(details[key].options, {value: modelJson[key]});
                        option.value = modelJson[key];
                        details[key].result = option && option[0];
                    }
                }

                this.set({
                    _id    : modelJson._id,
                    details: details
                });
            },

            urlRoot: function () {
                return '/rating/biYearly';
            }
        });
        return Model;
    });
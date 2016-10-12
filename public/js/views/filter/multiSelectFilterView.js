define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/filter/filterView',
    'text!templates/filter/filterTemplate.html'
], function (Backbone, $, _, FilterView, valuesTemplate) {
    var filterValuesView = FilterView.extend({
        template: _.template(valuesTemplate),

        selectValue: function (options) {
            var constantsFilter = this.filerConstants;
            var currentFilter;
            var checkElement = options.$currentElement.hasClass('checkedValue');

            if (!this.filter[options.filterName] && checkElement) {
                this.filter[options.filterName] = {
                    type  : constantsFilter.type,
                    values: [],
                    names : []
                };
            }

            currentFilter = this.filter[options.filterName];

            if (checkElement) {
                currentFilter.names.push(options.currentName);
                currentFilter.values.push(options.currentValue);
            } else {
                currentFilter.names = _.without(currentFilter.names, options.currentName);
                currentFilter.values = _.without(currentFilter.values, options.currentValue);
            }

            if (currentFilter.values.length) {
                options.$filterNameElement.addClass('checkedGroup');
            } else {
                options.$filterNameElement.removeClass('checkedGroup');
            }

            this.$el.find('.current').removeClass('current');

            this.trigger('selectValue', options);
        }
    });

    return filterValuesView;
});

var _ = require('underscore');
var FilterView = require('../../views/filter/filterView');
var valuesTemplate = require('../../../templates/filter/filterTemplate.html');

module.exports = FilterView.extend({
    template: _.template(valuesTemplate),

    selectValue: function (options) {
        var constantsFilter = this.filerConstants;
        var currentFilter;
        var checkElement = options.$currentElement.hasClass('checkedValue');

        this.filter[options.filterName] = {
            type  : constantsFilter.type,
            values: [],
            names : []
        };

        currentFilter = this.filter[options.filterName];

        if (checkElement) {
            currentFilter.names = [options.currentName];
            currentFilter.values = [options.currentValue];
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

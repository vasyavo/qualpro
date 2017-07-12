var _ = require('underscore');
var topBarTemplate = require('../../../templates/contractsSecondary/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = baseTopBar.extend({
    contentType       : CONTENT_TYPES.CONTRACTSSECONDARY,
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination),

    events: {
        'click .changeContentView.filterType': 'changeByFilterType'
    },

    changeByFilterType: function (e) {
        var targetEl = $(e.target);
        var filterType = targetEl.attr('data-filter-type');

        this.preventDefaults(e);

        this.changeTabs(filterType);
    },

    changeTabs: function (filterType) {
        var $curEl = this.$el;
        var $container = $curEl.find('#templateSwitcher');
        var $targetTab = $container.find('[data-filter-type="' + filterType + '"]');

        $targetTab.addClass('viewBarTabActive');
        $targetTab.siblings().removeClass('viewBarTabActive');

        this.trigger('showFilteredContent', filterType);
    }
});

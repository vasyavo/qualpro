define([
    'jQuery',
    'text!templates/contractsSecondary/topBarTemplate.html',
    'text!templates/pagination/pagination.html',
    'views/baseTopBar',
    'constants/contentType'
], function ($, topBarTemplate, pagination, baseTopBar, CONTENT_TYPES) {
    'use strict';

    var TopBarView = baseTopBar.extend({
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

    return TopBarView;
});
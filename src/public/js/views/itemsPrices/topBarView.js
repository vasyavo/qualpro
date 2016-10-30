define([
    'Underscore',
    'text!templates/itemsPrices/topBarTemplate.html',
    'text!templates/pagination/pagination.html',
    'views/baseTopBar',
    'views/itemsPrices/itemsToOutletView',
    'views/selectLocation/selectLocationView'
], function (_, topBarTemplate, pagination, baseTopBar, ItemsToOutletView, SelectLocationView) {
    var TopBarView = baseTopBar.extend({
        contentType       : 'itemsPrices',
        template          : _.template(topBarTemplate),
        paginationTemplate: _.template(pagination),

        events: {
            'click #linkBtn': 'showItemsToOutletDialog'
        },

        showItemsToOutletDialog: function (e) {
            var self = this;
            var selectLocationView = new SelectLocationView({
                translation: this.translation
            });

            selectLocationView.on('locationSelected', function (location) {
                new ItemsToOutletView({
                    filter     : location,
                    translation: self.translation
                });
            });
        }
    });

    return TopBarView;
});

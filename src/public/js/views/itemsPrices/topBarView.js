var _ = require('underscore');
var topBarTemplate = require('../../../templates/itemsPrices/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');
var ItemsToOutletView = require('../../views/itemsPrices/itemsToOutletView');
var SelectLocationView = require('../../views/selectLocation/selectLocationView');

module.exports = baseTopBar.extend({
    contentType       : 'itemsPrices',
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination),

    events: {
        'click #linkBtn': 'showItemsToOutletDialog'
    },

    showItemsToOutletDialog: _.debounce(function (e) {
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
    }, 1000, true)
});

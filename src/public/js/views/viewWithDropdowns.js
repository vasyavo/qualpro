var $ = require('jQuery');
var Backbone = require('backbone');
var populate = require('../populate');

module.exports = Backbone.View.extend({

    hideNewSelect: function () {
        $('.newSelectList').hide();
    },

    notHide: function () {
        return false;
    },

    nextSelect: function (e) {
        this.showNewSelect(e, false, true);
    },

    prevSelect: function (e) {
        this.showNewSelect(e, true, false);
    },

    showNewSelect: function (e, prev, next) {
        populate.showSelect(e, prev, next, this);
        return false;
    },

    chooseOption: function (e) {
        var $target = $(e.target);
        var holder = $target.parents('.cell').find('.currentSelected');

        holder.text($target.text()).attr('data-id', $target.attr('id'));
    }
});

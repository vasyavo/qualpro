var $ = require('jquery');
var _ = require('underscore');
var topBarTemplate = require('../../../templates/personnel/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');

module.exports = baseTopBar.extend({
    contentType       : 'personnel',
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination),

    events: {
        'click #sendEmail'           : 'sendPass',
        'click #sendSMS'             : 'sendPass',
        'click #supervisorBtn'       : 'addSupervisor',
        'click #actionHolder:not(ul)': 'showHideActionDd'

    },

    showHideActionDd: function (e) {
        e.stopPropagation();

        this.trigger('checkAvailableSendPass');

        this.showHideActionDropdown(e);
    },

    sendPass: function (e) {
        var type = $(e.target).attr('data-type');

        this.trigger('sendPass', type);
    },

    addSupervisor: function () {
        this.trigger('addSupervisor');
    }
});

'use strict';

define([
    'backbone',
    'Underscore',
    'jQuery',
    'text!templates/personnel/topBarTemplate.html',
    'text!templates/pagination/pagination.html',
    'views/baseTopBar'
], function (Backbone, _, $, topBarTemplate, pagination, baseTopBar, dataService, VisibilityForm) {
    var TopBarView = baseTopBar.extend({
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

    return TopBarView;
});

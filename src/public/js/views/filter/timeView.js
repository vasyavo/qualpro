var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var moment = require('moment');
var template = require('../../../templates/filter/time.html');
var requireContent = require('../../helpers/requireContent');
var CONSTANTS = require('../../constants/contentType');
var App = require('../../appState');

module.exports = Backbone.View.extend({
    contentType: 'time',
    template: _.template(template),
    events: {},

    initialize: function () {
        this.render();
    },

    save: function () {
        var $curEl = this.$el;
        var fromTime = $curEl.find('#startDate').val();
        var toTime = $curEl.find('#endDate').val();
        fromTime = fromTime ? moment(fromTime, 'DD.MM.YYYY, h:mm:ss').set('hour', 0).set('minute', 1).toISOString() : null;
        toTime = toTime ? moment(toTime, 'DD.MM.YYYY, h:mm:ss').set('hour', 23).set('minute', 59).toISOString() : null;

        this.trigger('dateSelected', {
            fromTime: fromTime,
            toTime: toTime
        });
    },

    render: function () {
        var self = this;
        var $curEl = this.$el;
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
        var translation = requireContent(CONSTANTS.ACTIVITYLIST + '.translation.' + currentLanguage);

        $curEl.html(this.template({
            translation: translation,
        }));

        $curEl = $curEl.dialog({
            dialogClass: 'timeDialog',
            title: 'Select Title',
            showCancelBtn: true,
            buttons: {
                save: {
                    text: translation.ok,
                    click: function () {
                        self.save();
                        $(this).dialog('destroy').remove();
                    }
                }
            }
        });

        $curEl.find('#startDate').datepicker({
            changeMonth: true,
            changeYear: true,
            yearRange: '-20y:c+10y',
            defaultDate: new Date(),
            onClose: function (selectedDate) {
                $curEl.find('#endDate').datepicker('option', 'minDate', selectedDate);
            }
        });

        $curEl.find('#endDate').datepicker({
            changeMonth: true,
            changeYear: true,
            yearRange: '-20y:c+10y',
            defaultDate: new Date(),
            onClose: function (selectedDate) {
                $curEl.find('#startDate').datepicker('option', 'maxDate', selectedDate);
            }
        });

        this.delegateEvents(this.events);

        return this;
    }
});

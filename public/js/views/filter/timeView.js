define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/filter/time.html',
    'moment'
], function (Backbone, $, _, template, moment) {

    var TimeView = Backbone.View.extend({
        contentType: 'time',
        template   : _.template(template),
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
                toTime  : toTime
            });
        },

        render: function () {
            var self = this;
            var $curEl = this.$el;

            $curEl.html(this.template());

            $curEl = $curEl.dialog({
                dialogClass  : 'timeDialog',
                title        : 'Select Title',
                showCancelBtn: true,
                buttons      : {
                    save: {
                        text : 'Ok',
                        click: function () {
                            self.save();
                            $(this).dialog('destroy').remove();
                        }
                    }
                }
            });

            $curEl.find('#startDate').datepicker({
                changeMonth: true,
                changeYear : true,
                yearRange  : '-100y:c+nn',
                defaultDate: new Date(),
                onClose    : function (selectedDate) {
                    $curEl.find('#endDate').datepicker('option', 'minDate', selectedDate);
                }
            });

            $curEl.find('#endDate').datepicker({
                changeMonth: true,
                changeYear : true,
                yearRange  : '-100y:c+nn',
                defaultDate: new Date(),
                onClose    : function (selectedDate) {
                    $curEl.find('#startDate').datepicker('option', 'maxDate', selectedDate);
                }
            });

            this.delegateEvents(this.events);

            return this;
        }
    });

    return TimeView;

});
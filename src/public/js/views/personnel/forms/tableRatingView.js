var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var template = require('../../../../templates/personnel/form/ratingTableTemplate.html');

module.exports = Backbone.View.extend({
    template : _.template(template),
    completed: false,
    events   : {
        'change .rating': 'ratingChanged'
    },

    initialize: function (options) {
        options = options || {};

        this.translation = options.translation;
        this.rating = options.rating;
        this.completed = !!this.rating.result;
        this.isRenderRatings = options.isRenderRatings;
    },

    ratingChanged: function (e) {
        var $target = $(e.target);
        var id = $target.attr('id');
        var newRating = $target.siblings('.br-widget').find('.br-current').attr('data-rating-value');
        var ratingElement = this.rating.elements.find(function (element) {
            return element.id === id;
        });

        ratingElement.value = +newRating;

        this.result = this.checkStateAndCalculateTotal();
        if (Number.isFinite(this.result)) {
            this.rating.result = this.result;
            this.$totalSpan.text(this.result.toFixed(1));
            this.$totalSpan.addClass('spanTotalValue');
        } else {
            this.rating.result = null;
            this.$totalSpan.text('');
            this.$totalSpan.removeClass('spanTotalValue');
        }
    },

    checkStateAndCalculateTotal: function () {
        var ratingElements = this.rating.elements;
        var length = ratingElements.length;
        var total = 0;
        var prevCompleted = this.completed;

        this.completed = true;

        for (var i = length; i--;) {
            if (!Number.isFinite(ratingElements[i].value)) {
                this.completed = false;

            }
            total += ratingElements[i].value;
        }
        if (this.completed !== prevCompleted) {
            this.trigger('stateChanged', {completed: this.completed, target: this});
        }

        return total / length;
    },

    render: function () {
        var $el = this.$el;

        $el.html(this.template({
            rating     : this.rating,
            translation: this.translation
        }));
        this.$totalSpan = $el.find('.totalSpan');

        if (this.isRenderRatings) {
            setTimeout(function () {
                $el.find('.rating').rate({readonly: false});
            }, 5);
        }
    }
});

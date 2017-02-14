define([
        'backbone',
        'text!templates/personnel/form/ratingSingleSelectTemplate.html'
    ],
    function (Backbone, template) {

        var View = Backbone.View.extend({
            template : _.template(template),
            completed: false,
            events   : {
                'click .ratingOption': 'optionSelected'
            },

            optionSelected: function (e) {
                var $selectedItem = $(e.target);
                var option = {
                    displayName: $selectedItem.attr('data-displayName'),
                    value      : $selectedItem.attr('data-value'),
                    toString   : function () {
                        return this.displayName
                    }
                };

                this.rating.result = option;

                if (!this.result) {
                    this.completed = true;
                    this.trigger('stateChanged', {completed: this.completed, target: this});
                }

                this.result = option;
            },

            initialize: function (options) {

                this.translation = options.translation
                this.rating = options.rating;
                this.completed = !!this.rating.result;
                this.preview = options.preview;
            },

            render: function () {
                this.$el.html(this.template({
                    rating     : this.rating,
                    preview    : this.preview,
                    translation: this.translation
                }));
            }
        });

        return View;
    });
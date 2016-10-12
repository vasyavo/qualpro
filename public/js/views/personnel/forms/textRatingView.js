define([
        'Backbone',
        'text!templates/personnel/form/ratingTextTemplate.html'
    ],
    function (Backbone, template) {

        var View = Backbone.View.extend({
            template : _.template(template),
            completed: true,

            events: {
                'change textarea': 'textChanged'
            },

            initialize: function (options) {

                this.translation = options.translation;
                this.rating = options.rating;
                this.preview = options.preview;
            },

            textChanged: function (e) {
                var $target = $(e.target);
                var text = $target.val();

                this.trigger('textAreaChanged', {text: text});
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
define(function (require) {

    var _ = require('underscore');
    var Marionette = require('marionette');
    var ChildView = require('views/documents/listItem');
    var Template = require('text!templates/documents/wrapper.html');

    return Marionette.CompositeView.extend({

        initialize : function (options) {
            this.translation = options.translation;
        },

        className : 'thumbnailHolder scrollable',

        template : function () {
            return Template;
        },

        onRender : function () {
            var that = this;
            var collection = this.collection;

            this.$el.on('scroll', _.debounce(function (event)  {
                if (that.isScrollReachedBottom(event)) {
                    that.collection.getNextPage();
                }
            }));
        },

        isScrollReachedBottom : function (event) {
            var target = event.target;
            var scrollTop = target.scrollTop;
            var scrollHeight = target.scrollHeight;
            var elementHeight = target.clientHeight;
            var scrolled = scrollTop + elementHeight;

            if ((scrolled / scrollHeight) === 1) {
                return true;
            }

            return false;
        },

        childViewContainer : '.items-container',

        childView : ChildView,

        childViewOptions : function () {
            return {
                translation : this.translation
            };
        },

        childViewEvents : {
            'checked' : 'childViewChecked'
        },

        childViewChecked : function (child) {
            var arrayOfCheckedItems = this.collection.checked;

            if (child.state) {
                arrayOfCheckedItems.push(child._id);
            } else {
                var valueIndex = arrayOfCheckedItems.indexOf(child._id);

                if (valueIndex > -1) {
                    arrayOfCheckedItems.splice(valueIndex, 1);
                }
            }

            this.collection.trigger('item:checked');
        },

        collectionEvents : {
            'sync' : 'render'
        }

    });

});

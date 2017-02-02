define(function (require) {

    var Marionette = require('marionette');
    var ChildView = require('views/documents/listItem');

    return Marionette.CollectionView.extend({

        initialize : function (options) {
            this.translation = options.translation;
        },

        className : 'thumbnailHolder scrollable',

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

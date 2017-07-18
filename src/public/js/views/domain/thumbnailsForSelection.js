var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var thumbnailsTemplate = require('../../../templates/domain/thumbnailsForSelection.html');
var thumbnailsList = require('../../../templates/domain/thumbnailList.html');
var FilterCollection = require('../../collections/filter/filterCollection');

module.exports = Backbone.View.extend({
    viewType        : 'thumbnails',
    template        : _.template(thumbnailsTemplate),
    reRenderTemplate: _.template(thumbnailsList),

    events: {
        "click .thumbnail:not(label,input)": "thumbnailsClick",
        "click #checkAll"                  : "checkAll"
    },

    initialize: function (options) {
        var self = this;
        this.collection = options.collection;
        this.selected = options.selected;
        this.filteredCollection = new FilterCollection(this.collection.toJSON());
        this.contentType = options.contentType;
        this.multiselect = options.multiselect;

        this.filteredCollection.on('reset', _.debounce(function () {
            self.reRender();
        }), 500);

        this.inputEvent = _.debounce(
            function (e) {
                var $target = $(e.currentTarget);
                var value = $target.val();
                var newFilteredCollection;

                if (!value) {
                    return self.filteredCollection.reset(self.collection.toJSON());
                }

                newFilteredCollection = self.filterCollection(value);

                self.filteredCollection.reset(newFilteredCollection);
            }, 500);

        this.render();
    },

    filterCollection: function (value) {
        var resultCollection;
        var regex;

        regex = new RegExp(value, 'i');

        resultCollection = this.collection.filter(function (model) {
            var name = model.get('name');
            var nameEn = model.get('name').en || '';
            var nameAr = model.get('name').ar || '';

            if (nameEn.match(regex) || nameAr.match(regex)) {
                return model;
            }
        });

        return resultCollection;
    },

    checkCheckAll: function (checked, id) {
        if (this.multiselect && checked) {
            this.selected.push(id);
        } else if (!this.multiselect && checked) {
            this.selected = [id];
        } else {
            this.selected = _.without(this.selected, id);
        }

        if (this.multiselect) {
            if (this.selected.length === this.collection.length && checked) {
                this.$el.find('#checkAll').prop('checked', true);
            } else {
                this.$el.find('#checkAll').prop('checked', false);
            }
            return;
        }
    },

    checkAll: function (e) {
        var $el = $(e.target);
        var $dialog = $el.closest('.domainDialog');
        var $checkboxes = $dialog.find('input[type="checkbox"]:not(#checkAll)');
        var check = $el.prop("checked");
        var collectionJSON = this.collection.toJSON();

        if (check) {
            this.selected = _.pluck(collectionJSON, '_id');
        } else {
            this.selected = [];
        }

        $checkboxes.prop("checked", check);
    },

    reRender : function (){
        var opt = {
            collection : this.filteredCollection.toJSON(),
            itemsCount : this.filteredCollection.length,
            selected   : this.selected
        };
        this.$el.find('.scrollable').remove();
        this.$el.closest('.domainDialog').append(this.reRenderTemplate(opt));
        this.$el.find('.scrollable').mCustomScrollbar();
    },

    render: function () {
        var opt = {
            collection : this.collection.toJSON(),
            itemsCount : this.collection.length,
            selected   : this.selected,
            contentType: this.contentType,
            multiselect: this.multiselect
        };
        var $nameInput;

        if (this.collection.length === 1) {
            this.selected.push(this.collection.at(0).get('_id'));
        }

        var formString = this.template(opt);
        var self = this;

        this.$el = $(formString).dialog({
            dialogClass: "edit-dialog",
            title      : "Add " + self.contentType,
            buttons    : {
                save: {
                    text : "Save",
                    class: "btn",
                    click: function () {
                        self.trigger('elementsSelected', self.selected);
                        self.$el.closest('.edit-dialog').remove();
                    }
                }
            }
        });

        if (!this.multiselect && this.selected.length === 1) {
            this.$checkbox = this.$el.find('input[type="checkbox"]:not(#checkAll):checked');
        }

        $nameInput = this.$el.find('.searchInputWrap > input');

        $nameInput.on('input', function (e) {
            self.inputEvent(e);
        });

        this.$el.find('.scrollable').mCustomScrollbar();

        this.delegateEvents(this.events);
        return this;
    },

    thumbnailsClick: function (e) {
        var div = $(e.target).closest('.thumbnail');
        var checkbox = div.find('input:checkbox');
        var checked = !checkbox.prop('checked');
        var id = checkbox.val();

        e.preventDefault();
        e.stopPropagation();

        if (!this.multiselect) {
            if (this.$checkbox) {
                this.$checkbox.prop('checked', false);
            }

            this.$checkbox = checkbox;
        }

        checkbox.prop('checked', checked);

        this.checkCheckAll(checked, id);
    }

});

define([
        'Backbone',
        'Underscore',
        'jQuery',
        'text!templates/domain/thumbnailsForSelection.html'
    ],
    function (Backbone, _, $, thumbnailsTemplate) {
        var View = Backbone.View.extend({
            viewType: 'thumbnails',
            template: _.template(thumbnailsTemplate),

            events: {
                "click .thumbnail:not(label,input)": "thumbnailsClick",
                "click #checkAll"                  : "checkAll"
            },

            initialize: function (options) {
                this.collection = options.collection;
                this.selected = options.selected;
                this.contentType = options.contentType;
                this.multiselect = options.multiselect;
                this.render();
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

            render: function () {
                var opt = {
                    collection : this.collection.toJSON(),
                    itemsCount : this.collection.length,
                    selected   : this.selected,
                    contentType: this.contentType,
                    multiselect: this.multiselect
                };

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
                                var checked = self.$el.find('input:not(#checkAll):checked');
                                var ids = [];

                                checked.each(function (index, checkbox) {
                                    ids.push($(checkbox).attr('id'));
                                });

                                self.trigger('elementsSelected', ids);
                                self.$el.closest('.edit-dialog').remove();

                            }
                        }
                    }
                });

                if (!this.multiselect && this.selected.length === 1) {
                    this.$checkbox = this.$el.find('input[type="checkbox"]:not(#checkAll):checked');
                }

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

        return View;
    });



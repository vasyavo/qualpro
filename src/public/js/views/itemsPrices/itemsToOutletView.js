var $ = require('jquery');
var _ = require('underscore');
var mainTemplate = require('../../../templates/itemsPrices/itemsToOutlet/main.html');
var headerTemplate = require('../../../templates/itemsPrices/itemsToOutlet/header.html');
var listTemplate = require('../../../templates/itemsPrices/itemsToOutlet/list.html');
var BaseDialog = require('../../views/baseDialog');
var ItemsPricesCollection = require('../../collections/item/collection');
var linkItemsToOutlets = require('../../helpers/linkItemsToOutlet');
var dataService = require('../../dataService');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var App = require('../../appState');

module.exports = BaseDialog.extend({
    contentType   : 'itemsToOutlet',
    template      : _.template(mainTemplate),
    headerTemplate: _.template(headerTemplate),
    listTemplate  : _.template(listTemplate),
    linker        : linkItemsToOutlets(),

    events: {
        'click .arrowRight'   : 'migrateToOutlet',
        'click .cross'        : 'migrateToItem',
        'keyup .categoryInput': 'searchData'
    },

    initialize: function (options) {
        var self = this;

        this.translation = options.translation;
        this.location = _.mapObject(options.filter, function (obj) {
            return obj.values[0];
        });

        this.locationString = '';

        _.mapObject(options.filter, function (obj) {
            if (self.locationString === '') {
                self.locationString += obj.names[0];
            } else {
                self.locationString += '>' + obj.names[0];
            }
        });

        this.collection = new ItemsPricesCollection({location: true, filter: options.filter, count: -1}, {parse: true});

        this.collection.bind('reset', function () {
            this.renderLists();
        }, this);
        this.currentLanguage = App.currentUser && App.currentUser.currentLanguage || 'en';

        this.makeRender(options);
        this.render();
    },

    searchData: function (e) {
        var $target = $(e.target);
        var text = $target.val();
        var $container = $target.closest('.dialogOutletItem');
        var content = $container.attr('data-content');
        var exists = content === 'outlet' || false;

        var data = this.collection.search({exists: exists, text: text});

        this.renderList({content: content, data: data});
    },

    migrateToList: function (e, tolistType) {
        var $row = $(e.target).closest('tr');
        var tables = tolistType === 'items' ? {
            from: this.$outletBody,
            to  : this.$itemsBody
        } : {
            from: this.$itemsBody,
            to  : this.$outletBody
        };

        this.linker.migrateRow($row, tables, this.collection);
    },

    migrateToOutlet: function (e) {
        this.migrateToList(e, 'outlet');
    },

    migrateToItem: function (e) {
        this.migrateToList(e, 'items');
    },

    renderList: function (options) {
        var content = options.content;
        var data = options.data || [];

        var $contentBody = this['$' + content + 'Body'];

        $contentBody.html(this.listTemplate({
            listType   : content,
            items      : data || [],
            translation: this.translation
        }));
    },

    renderLists: function () {
        var $thisEl = this.$el;
        var group = this.collection.createGroupedJsons();

        this.$items = $thisEl.find('#items');
        this.$outlet = $thisEl.find('#outlet');
        this.$itemsBody = this.$items.find('.itemsList');
        this.$outletBody = this.$outlet.find('.itemsList');

        this.renderList({content: 'items', data: group.false});
        this.renderList({content: 'outlet', data: group.true});
    },

    addItemsToOutletLocation: function (cb) {
        var ids = this.$outletBody.find('[data-type="item"]').map(function () {
            return $(this).attr('data-id');
        }).get();

        if (!ids.length) {
            return App.render({
                type   : 'error',
                message: ERROR_MESSAGES.itemPricesNotSelected[this.currentLanguage]
            });
        }

        dataService.putData('/item/location', {
            ids     : ids,
            location: this.location
        }, function (err, resp) {
            if (err) {
                return App.render(err);
            }
            cb();
        });

    },

    render: function () {
        var template = this.template({
            translation: this.translation
        });
        var $template = $(template);
        var self = this;

        $template.find('#items')
            .html('')
            .append(this.headerTemplate({
                listType   : 'items',
                translation: self.translation
            }));
        $template.find('#outlet')
            .html('')
            .append(this.headerTemplate({
                listType   : 'outlet',
                location   : self.locationString,
                translation: self.translation
            }));

        this.$el = $template.dialog({
            dialogClass: 'itemsToOutletDialog',
            title      : this.translation.listedItems,
            width      : '80%',
            height     : '80%',
            buttons    : {
                save: {
                    text : self.translation.saveBtn,
                    click: function () {
                        var that = this;
                        self.addItemsToOutletLocation(function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                },

                cancel: {
                    text: self.translation.cancelBtn
                }
            }
        });

        this.delegateEvents(this.events);

        return this;
    }
});

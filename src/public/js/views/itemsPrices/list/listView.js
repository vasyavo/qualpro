var async = require('async');
var _ = require('underscore');
var $ = require('jquery');
var headerTemplate = require('../../../../templates/itemsPrices/list/header.html');
var createView = require('../../../views/itemsPrices/createView');
var ListItemsView = require('../../../views/itemsPrices/list/listItemsView');
var paginator = require('../../../views/paginator');
var contentCollection = require('../../../collections/itemsPrices/collection');
var REGEXP = require('../../../constants/validation');
var STATUSES = require('../../../constants/personnelStatuses');
var dataService = require('../../../dataService');
var ERROR_MESSAGES = require('../../../constants/errorMessages');
var BadgeStore = require('../../../services/badgeStore');
var App = require('../../../appState');

module.exports = paginator.extend({
    contentType: 'itemsPrices',
    viewType   : 'list',
    template   : _.template(headerTemplate),

    CreateView: createView,
    //TODO Maybe rewrite logic of display personnel phoneNumber and status in newRow
    REGEXP    : REGEXP,
    STATUSES  : STATUSES,

    events: {
        'click .checkboxLabel'        : 'checked',
        'click input[type="checkbox"]': 'inputClick'
    },

    initialize: function (options) {
        var self = this;

        this.translation = options.translation;
        this.filter = options.filter;
        this.collection = options.collection;
        this.defaultItemsNumber = this.collection.pageSize;
        this.listLength = this.collection.totalRecords;
        this.page = options.collection.page;
        this.singleSelect = options.singleSelect;

        BadgeStore.cleanupItemAndPrices();

        this.makeRender(options);
        this.inputEvent = _.debounce(
            function (e) {
                var target = e.target || e;
                var value = target.value;

                this.collection.getSearchedCollection('fullName', value, contentCollection);

            }, 500);
    },

    render: function () {
        var $currentEl = this.$el;
        var archived;
        if (!this.filter || !this.filter.archived) {
            archived = false;
        } else {
            archived = this.filter.archived.values[0];
        }

        $currentEl.html('');

        $currentEl.append(this.template({
            archived   : archived,
            translation: this.translation,
            App: App,
        }));

        this.$itemsEl = $currentEl.find('.listTable');

        $currentEl.append(new ListItemsView({
            el         : this.$itemsEl,
            archived   : archived,
            collection : this.collection,
            translation: this.translation
        }).render());

        $currentEl.find('.forChange').toggle(archived);
        $currentEl.find('.changeColSpan').attr('colspan', !archived ? 8 : 9);

        return this;
    },

    showMoreContent: function (newModels) {
        var holder = this.$el;
        var itemView;
        var archived;

        if (!this.filter || !this.filter.archived) {
            archived = false;
        } else {
            archived = this.filter.archived.values[0];
        }

        this.trigger('hideActionDd');

        holder.find('.listTable').empty();

        itemView = new ListItemsView({
            el         : this.$itemsEl,
            collection : newModels,
            archived   : archived,
            translation: this.translation
        });

        holder.append(itemView.render());
        itemView.undelegateEvents();

        holder.find('#checkAll').prop('checked', false);

        holder.find('.forChange').toggle(archived);
        holder.find('.changeColSpan').attr('colspan', !archived ? 8 : 9);
    },

    archiveItems: function (e) {
        var self = this;
        var checkboxes = this.$el.find('input:checkbox:checked');
        var $el = $(e.target);
        var data = {};
        var value = $el.attr('id') === 'archiveBtn';
        var archiveData = [];
        var newArchiveData = {};
        var sendData;
        var sendUrl;
        var currentLanguage = App.currentUser.currentLanguage;

        checkboxes.each(function (i) {
            var id = $(checkboxes[i]).val();
            var archiveContentType = $(checkboxes[i]).attr('data-contenttype');
            var data = {
                id         : id,
                contentType: archiveContentType
            };

            if (data.contentType) {
                archiveData.push(data);
            }
        });

        checkboxes.click();

        archiveData.forEach(function (item, key) {
            if (!newArchiveData[item.contentType]) {
                newArchiveData[item.contentType] = [];
            }
            newArchiveData[item.contentType].push(item.id);
        });

        function getParallelFunction(url, data) {
            return function (callback) {
                dataService.putData(url, data, function (error, result) {
                    if (error) {
                        return callback(error);
                    }
                    return callback(null, result);
                });
            };
        }

        for (var prop in newArchiveData) {
            sendUrl = '/' + prop + '/remove';
            sendData = {
                ids    : newArchiveData[prop],
                archive: value
            };

            data[prop] = getParallelFunction(sendUrl, sendData);
        }

        async.parallel(data, function (err, res) {
            var tabId = value ? 'archived' : 'all';

            if (err) {
                App.render({type: 'error', message: ERROR_MESSAGES.unArchiveError[currentLanguage]});
            } else {
                App.render({type: 'notification', message: ERROR_MESSAGES.unArchiveSuccess[currentLanguage]});
                self.trigger('changeTabs', tabId);
            }
        });
    }
});

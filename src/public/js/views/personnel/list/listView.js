define([
    'backbone',
    'jQuery',
    'Underscore',
    'text!templates/personnel/list/header.html',
    'models/personnel',
    'views/personnel/createView',
    'views/personnel/list/listItemsView',
    'views/filter/filtersBarView',
    'views/paginator',
    'views/personnel/preView/preView',
    'views/personnel/editView',
    'collections/personnel/collection',
    'text!templates/personnel/list/newRow.html',
    'constants/validation',
    'constants/personnelStatuses',
    'dataService',
    'views/personnel/listForSelection',
    'constants/errorMessages'
], function (Backbone, $, _, headerTemplate, Model, createView, ListItemsView, filterView, paginator,
             PreView, EditView, contentCollection, newRow, REGEXP, STATUSES, dataService,
             PersonnelListForSelectionView, ERROR_MESSAGES) {
    var View = paginator.extend({
        EditView   : EditView,
        contentType: 'personnel',
        viewType   : 'list',
        template   : _.template(headerTemplate),
        templateNew: _.template(newRow),

        CreateView: createView,
        REGEXP    : REGEXP,
        STATUSES  : STATUSES,

        events: {
            'click .checkboxLabel'        : 'checked',
            'click input[type="checkbox"]': 'inputClick_',
            'click .listRow:not(label)'   : 'incClicks'
        },

        initialize: function (options) {

            this.translation = options.translation;
            this.tabName = options.tabName;
            this.filter = options.filter;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;
            this.singleSelect = options.singleSelect;

            options.contentType = this.contentType;

            this.makeRender(options);
        },

        inputClick_: function (e) {
            e.stopPropagation();

            this.checkAvailableSendPass();
            this.inputClick(e);
        },

        listRowClick: function (e) {
            var targetEl = $(e.target);
            var targetRow = targetEl.closest('tr');
            var name = targetRow.attr('data-name');
            var id = targetRow.attr('data-id');
            var model = this.collection.get(id);

            this.preView = new PreView({
                model      : model,
                translation: this.translation
            });

            this.CoverPreview = PreView;

            this.preView.on('disableEvent', this.archiveItems, this);
            this.preView.on('openEditView', this.editItem, this);
        },

        sendPass: function (type) {
            var checkboxes = this.$el.find('input:checkbox:checked:not(#checkAll)');
            var self = this;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

            checkboxes.each(function (index, el) {
                var id = $(el).attr('id');

                dataService.putData('/personnel/' + id, {
                    sendPass: true,
                    type    : type
                }, function (err, result) {
                    var model;
                    var tempCollection;
                    var oldPhone;

                    if (err) {
                        return App.render({type: 'error', message: err});
                    }

                    oldPhone = result.phoneNumber;

                    tempCollection = self.listItemsView.composeDataForListView([result]);
                    model = new Model(tempCollection[0], {parse: true});
                    model.set({
                        phoneNumber: oldPhone
                    });
                    self.addReplaceRow(model);
                    App.render({type: 'notification', message: ERROR_MESSAGES.passwordWasSent[currentLanguage]});
                });
            });
        },

        addSupervisor: function () {
            var self = this;
            var checkboxes = this.$el.find('input:checkbox:checked:not(#checkAll)');
            var id = checkboxes[0].id;
            var model = self.collection.get(id);
            var modelJSON = model.toJSON();
            var modelLevel = modelJSON.accessRole.level;
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';


            var creationOptions = {
                multiselect       : false,
                withoutTabs       : true,
                parrentContentType: this.contentType,
                supervisorFilter  : modelLevel,
                title             : 'addSupervisor'
            };
            var defFilter = {
                $or: {
                    type  : 'collection',
                    values: []
                }
            };
            var defLocationArr = ['country', 'region', 'subRegion', 'branch'];

            //Salesman Merchandiser CashVan are equal
            if (modelLevel === 6 || modelLevel === 7) {
                modelLevel = 5;
            }

            //Supervisor to MU is only MA
            if (modelLevel === 8) {
                modelLevel = 2;
            }

            //Supervisor to CU are MA and CA
            if (modelLevel === 9) {
                modelLevel = 3;
            }

            defLocationArr.length = (modelLevel - 2) > 0 ? (modelLevel - 2) : 0;

            if (modelLevel !== 1) {
                defFilter.$or.values = defFilter.$or.values.concat([
                    {
                        country           : {
                            type   : 'emptyArray',
                            values : [1],
                            options: {$eq: true}
                        },
                        'accessRole.level': {
                            type  : 'integer',
                            values: [1]
                        }
                    }]
                );
            }

            defLocationArr.forEach(function (location, index) {
                var tempObj = {};

                if (modelJSON[location].length) {
                    tempObj[location] = {
                        type  : 'ObjectId',
                        values: _.pluck(modelJSON[location], '_id'),
                        names : _.pluck(_.pluck(modelJSON[location], 'name'), 'currentLanguage')
                    };
                    tempObj['accessRole.level'] = {
                        type  : 'integer',
                        values: [index + 2]
                    };

                    defFilter.$or.values = defFilter.$or.values.concat(tempObj);
                }
            });

            if (defFilter.$or.values.length) {
                creationOptions.defFilter = Object.keys(defFilter).length ? defFilter : null;
            }

            this.personnelListForSelectionView = new PersonnelListForSelectionView(creationOptions);

            this.personnelListForSelectionView.on('coverSaved', function (personnelCollection) {
                var jsonPersonnels = personnelCollection.toJSON();
                var personnelsIds = _.pluck(jsonPersonnels, '_id');

                model.setFieldsNames(self.translation);
                model.save({manager: personnelsIds[0]}, {
                    patch  : true,
                    wait   : true,
                    success: function (model) {
                        App.render({
                            type   : 'notification',
                            message: ERROR_MESSAGES.supervisorAssignedSuccess[currentLanguage]
                        });
                    },
                    error  : function (model, xhr) {
                        App.render({type: 'error', message: xhr.responseText});
                    }
                });
            });
        },

        checkAvailableSendPass: function () {
            var checkboxes = this.$el.find('input:checkbox:checked:not(#checkAll)');
            var showPass = false;
            var showPassNum = 0;
            var showAddSupervisor = true;
            var showArchive = true;
            var self = this;
            var curLevel = App.currentUser.accessRole.level;
            var options = {};

            checkboxes.each(function (index, el) {
                var id = $(el).attr('id');
                var modelJSON = self.collection.get(id).toJSON();
                var level;

                if (!modelJSON.temp && App.currentUser._id !== modelJSON._id) {
                    showPassNum++;
                }

                level = modelJSON.accessRole && modelJSON.accessRole.level || 1;

                if ((curLevel <= 2 && curLevel >= 8) || checkboxes.length !== 1 || level < 2 || App.currentUser._id === modelJSON._id) {
                    showAddSupervisor = false;
                }

                if (App.currentUser._id === modelJSON._id) {
                    showArchive = false;
                }
            });

            if (showPassNum === checkboxes.length && curLevel <= 2) {
                showPass = true;
            }

            options.sendPass = (showPass && this.tabName !== 'archived');

            options.supervisorBtn = (showAddSupervisor && this.tabName !== 'archived');

            options.archiveBtn = (showArchive && this.tabName !== 'archived');

            this.trigger('changeActionButtons', options);
        },

        render: function () {
            var $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(this.template({
                translation: this.translation
            }));

            this.$itemsEl = $currentEl.find('.listTable');
            this.listItemsView = new ListItemsView({
                el         : this.$itemsEl,
                collection : this.collection,
                translation: this.translation
            });

            $currentEl.append(this.listItemsView.render());

            //subscribing on online status of users
            App.socket.emit('subscribe_online_status');

            App.socket.on('goOnline', (userId) => {
                var onlineStatusTd = $(`#online-${userId.uid}`);
                var statusTd = $(`#status-${userId.uid}`);
                onlineStatusTd.removeClass('hidden');
                statusTd.addClass('hidden');
            });

            App.socket.on('goOffline', (userId) => {
                var onlineStatusTd = $(`#online-${userId.uid}`);
                var statusTd = $(`#status-${userId.uid}`);
                onlineStatusTd.addClass('hidden');
                statusTd.removeClass('hidden');
            });

            return this;
        },

        showMoreContent: function (newModels) {
            var $holder = this.$el;
            var itemView;

            this.pageAnimation(this.collection.direction, $holder);

            this.trigger('hideActionDd');

            $holder.find('.listTable').empty();

            itemView = new ListItemsView({
                el         : this.$itemsEl,
                collection : newModels,
                translation: this.translation
            });

            $holder.append(itemView.render());
            itemView.undelegateEvents();

            $holder.find('#checkAll').prop('checked', false);
        }
    });

    return View;
});

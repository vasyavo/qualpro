var _ = require('underscore');
var $ = require('jquery');
var thumbnailsTemplate = require('../../../../templates/personnel/thumbnails/thumbnails.html');
var thumbnails = require('../../../views/thumbnails');
var PreView = require('../../../views/personnel/preView/preView');
var EditView = require('../../../views/personnel/editView');
var dataService = require('../../../dataService');
var createView = require('../../../views/personnel/createView');
var newThumbnail = require('../../../../templates/personnel/thumbnails/newThumbnail.html');
var STATUSES = require('../../../constants/personnelStatuses');
var PersonnelListForSelectionView = require('../../../views/personnel/listForSelection');
var ERROR_MESSAGES = require('../../../constants/errorMessages');
var BadgeStore = require('../../../services/badgeStore');
var App = require('../../../appState');

module.exports = thumbnails.extend({
    contentType: 'personnel',
    viewType   : 'thumbnails',
    template   : _.template(thumbnailsTemplate),
    templateNew: _.template(newThumbnail),

    CreateView: createView,
    EditView  : EditView,

    events: {
        'click .checkboxLabel'             : 'checked', //method locate in paginator
        "click input[type='checkbox']"     : 'inputClick_',
        'click .thumbnail:not(label,input)': 'incClicks'
    },

    initialize: function (options) {

        this.currentLanguage = (App && App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
        this.translation = options.translation;
        this.filter = options.filter;
        this.ContentCollection = options.ContentCollection;
        this.collection = options.collection;
        this.defaultItemsNumber = this.collection.pageSize;
        this.listLength = this.collection.totalRecords;
        this.page = options.collection.page;

        BadgeStore.cleanupPersonnel();

        this.makeRender(options);
    },

    updateModel: function (model) {
        model.country.toString = function () {
            var mappedArray = this.map(function (item) {
                return item.name.en;
            });
            return mappedArray.join(', ');
        };
    },

    inputClick_: function (e) {
        e.stopPropagation();

        this.checkAvailableSendPass();
        this.inputClick(e);
    },

    sendPass: function (type) {
        var checkboxes = this.$el.find('input:checkbox:checked:not(#checkAll)');
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

        checkboxes.each(function (index, el) {
            var id = $(el).attr('id');

            dataService.putData('/personnel/' + id, {
                sendPass: true,
                type    : type
            }, function (err, result) {
                if (err) {
                    return App.render({type: 'error', message: err});
                }
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
        var creationOptions = {
            multiselect       : false,
            withoutTabs       : true,
            parrentContentType: this.contentType,
            supervisorFilter  : modelLevel,
            title             : 'addSupervisor'
        };
        var defFilter = {
            '$or': {
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
                        'country'         : {
                            type   : 'emptyArray',
                            values : [1],
                            options: {$eq: true}
                        },
                        'accessRole.level': {
                            type  : 'integer',
                            values: [1]
                        }
                    }
                ]
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
                        message: ERROR_MESSAGES.supervisorAssignedSuccess[self.currentLanguage]
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

            if (modelJSON.status.classCss && (modelJSON.status.classCss === 'sendPass' || modelJSON.status.classCss === 'inactive')) {
                showPassNum++;
            }

            if (modelJSON.status && (modelJSON.status === 'sendPass' || modelJSON.status === 'inactive')) {
                showPassNum++;
            }

            level = modelJSON.accessRole && modelJSON.accessRole.level || 1;

            if (((curLevel <= 2 && curLevel >= 8) || checkboxes.length !== 1 || level < 2) && App.currentUser.workAccess) {
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
        var self = this;
        var jsonCollection = this.collection.toJSON();
        var $holder;

        jsonCollection.forEach(function (item) {
            self.updateModel(item);
        });

        $currentEl.html('');

        $currentEl.append('<div class="thumbnailsHolder scrollable"><div class="thumbnailsItems"></div></div>');

        $holder = $currentEl.find('.thumbnailsItems');

        jsonCollection.forEach(function (element) {
            var status = element.status;
            var message;

            if (status === 'login') {
                message = STATUSES[status.toUpperCase()].name[self.currentLanguage] + ' ' + element.lastAccess;
            } else {
                message = STATUSES[status.toUpperCase()].name[self.currentLanguage];
            }

            element.status = {
                classCss: status,
                message : message
            };
        });

        $holder.append(this.template({
            collection : jsonCollection,
            translation: this.translation
        }));

        $currentEl.find('.rating').barrating({readonly: true});

        return this;
    },

    showMoreContent: function (newModels) {
        var self = this;
        var $currentEl = this.$el;
        var $holder = $currentEl.find('.thumbnailsItems');
        var jsonCollection = newModels.toJSON();
        var currentLanguage = (App && App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';


        this.pageAnimation(this.collection.direction, $holder);

        jsonCollection.forEach(function (element) {
            var status = element.status;
            var message;

            if (status === 'login') {
                message = STATUSES[status.toUpperCase()].name[currentLanguage] + ' ' + element.lastAccess;
            } else {
                message = STATUSES[status.toUpperCase()].name[currentLanguage];
            }

            element.status = {
                classCss: status,
                message : message
            };
        });

        $holder.empty();
        $holder.html(this.template({
            collection : jsonCollection,
            translation: this.translation
        }));

        $currentEl.find('.rating').barrating({readonly: true});

        this.trigger('selectedElementsChanged', {
            length  : 0,
            checkAll: false
        });
    },

    showPreview: function (e) {
        var targetEl = $(e.target);
        var targetDivContainer = targetEl.closest(".thumbnail.personnel");
        var id = targetDivContainer.attr('data-id');
        var model = this.collection.get(id);

        this.preView = new PreView({
            model      : model,
            translation: this.translation
        });

        this.preView.on('disableEvent', this.archiveItems, this);
        this.preView.on('openEditView', this.editItem, this);

        e.stopPropagation();
    }

});

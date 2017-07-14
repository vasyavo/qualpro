var $ = require('jQuery');
var _ = require('underscore');
var Cookies = require('js-cookie');
var template = require('../../../templates/personnel/listForSelection.html');
var templateWithoutTabs = require('../../../templates/personnel/listForSelectionWithoutTabs.html');
var headerTemplate = require('../../../templates/personnel/list/header.html');
var paginator = require('../../views/paginator');
var ListItemsView = require('../../views/personnel/list/listItemsView');
var personnelCollection = require('../../collections/personnelForSelection/collection');
var Collection = require('../../collections/personnel/collection');
var personnelModel = require('../../models/personnel');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var App = require('../../appState');

module.exports = paginator.extend({
    contentType        : 'personnel',
    template           : _.template(template),
    templateWithoutTabs: _.template(templateWithoutTabs),
    headerTemplate     : _.template(headerTemplate),

    events: {
        'click .checkboxLabel'        : 'checked',
        'click input[type="checkbox"]': 'inputClick',
        'click .filterHeader'         : 'toggleFilterHolder'
    },

    initialize: function (options) {
        var self = this;
        var collectionOptions;

        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
        var translationUrl = 'translations/' + currentLanguage + '/personnel';

        this.personnelToOnLeave = options.personnelToOnLeave ? options.personnelToOnLeave.toJSON() : {};

        options = options || {};

        if (options.withoutTabs) {
            this.template = this.templateWithoutTabs;
            this.withoutTabs = options.withoutTabs;
        }
        this.translation = options.translation;
        this.notCheckFilters = options.notCheckFilters;

        this.filter = options.filter || options.defFilter || {};
        this.title = options.title;
        this.parrentContentType = options.parrentContentType;
        options.contentType = this.contentType;
        this.multiselect = options.multiselect;
        this.objectiveType = options.objectiveType;

        options.dialog = true;

        collectionOptions = {
            count      : -1,
            contentType: this.parrentContentType
        };

        if (this.personnelToOnLeave) {
            if (!options.defFilter) {
                options.defFilter = this.filter;
            }
            options.defFilter._id = {
                values : [this.personnelToOnLeave._id],
                options: {$nin: true},
                type   : 'ObjectId'
            };
        }

        if (this.objectiveType) {
            if (!options.defFilter) {
                options.defFilter = this.filter;
            }
            options.defFilter.objectiveType = {
                names : [this.objectiveType],
                values: [this.objectiveType],
                type  : 'objectiveType'
            };
        }

        if (options.supervisorFilter) {
            this.supervisorFilter = options.supervisorFilter;
            collectionOptions.supervisorFilter = options.supervisorFilter;
        }

        if (options.defFilter) {
            this.defFilter = options.defFilter;
            collectionOptions.filter = options.defFilter;
        }

        this.collection = new personnelCollection(collectionOptions);

        require([translationUrl], function (translation) {
            self.translation = translation;

            options.translation = translation;

            self.makeRender(options);

            self.collection.bind('reset', _.bind(self.render, self));

            self.on('coverSaved', function () {
                self.filterView.removeAll();
                self.$el.dialog('close').dialog('destroy').remove();
            }, self);

            self.bind('filter', self.showFilteredPage, self);

            _.bindAll(self, 'saveItem');

            self.collection.bind('showMore', self.showMoreContent, self);
        });

    },

    showFilteredPage: function () {
        var collectionOptions = {
            count      : -1,
            filter     : this.filter,
            contentType: this.parrentContentType
        };

        if (this.supervisorFilter) {
            collectionOptions.supervisorFilter = this.supervisorFilter;
        }

        if (this.objectiveType) {
            collectionOptions.objectiveType = this.objectiveType;
        }

        this.collection.firstPage(collectionOptions);
    },

    inputClick: function (e) {
        var $curEl = this.$el;
        var $currentChecked = $(e.target);
        var $checkBoxes = $curEl.find('input[type="checkbox"]:checked').not($currentChecked);

        e.stopPropagation();

        if (!this.multiselect) {
            $checkBoxes.each(function () {
                $(this).prop('checked', false);
            });
        } else {
            if ($checkBoxes.length >= 2) {
                return false;
            }

            $(this).prop('checked', true);
        }
    },

    toggleFilterHolder: function (e) {
        var $target = $(e.target);
        var $filterBar = $target.closest('.filterBar');
        var $filterBarName = $filterBar.find('.filterHeader');

        if ($target.closest('.searchInputWrap').length) {
            return false;
        }

        $filterBarName.toggleClass('downArrow');
        $filterBarName.toggleClass('upArrow');

        $filterBar.toggleClass('filterBarCollapse');
        this.$el.find('.scrollable').mCustomScrollbar('update');
    },

    saveItem: function () {
        var self = this;
        var $thisEl = this.$el;
        var $listForSelection = $thisEl.find('#listForSelection');
        var activeTab = $listForSelection.find('.tabs').tabs('option', 'active');
        var currentLanguage = App.currentUser.currentLanguage;
        var model;
        var models = [];
        var modelId;
        var $checkedTr;
        var lastName;
        var firstName;
        var phoneNumber;
        var email;
        var tempEmployee;
        var collection;

        if (activeTab === 0 || this.withoutTabs) {
            $checkedTr = $listForSelection.find('input[type="checkbox"]:checked').closest('tr');

            if ($checkedTr.html()) {
                $checkedTr.each(function (i, el) {
                    var $el = $(el);
                    var firstName = $el.find('.firstName').text();
                    var lastName = $el.find('.lastName').text();

                    modelId = $el.attr('data-id');
                    model = self.collection.get(modelId);
                    model.set('fullName', firstName + ' ' + lastName);
                    models.push(model);
                });

                collection = new Collection({fetch: false});
                collection.reset(models);
                this.trigger('coverSaved', collection);
            } else {
                App.render({
                    type   : 'alert',
                    message: ERROR_MESSAGES.checkEmployeeFirst[currentLanguage]
                });
            }

        } else if (activeTab === 1) {
            firstName = $.trim($listForSelection.find('input.firstName').val());
            lastName = $.trim($listForSelection.find('input.lastName').val());
            phoneNumber = $.trim($listForSelection.find('input.phoneNumber').inputmask('unmaskedvalue'));
            email = $.trim($listForSelection.find('input.email').val());

            if (firstName && lastName && phoneNumber && email) {
                tempEmployee = new personnelModel();


                tempEmployee.setFieldsNames(this.translation);

                tempEmployee.save({
                    temp: true,

                    firstName: {
                        en: firstName || ''
                    },

                    lastName: {
                        en: lastName || ''
                    },

                    position   : this.personnelToOnLeave.position._id,
                    country    : _.pluck(this.personnelToOnLeave.country, '_id'),
                    region     : _.pluck(this.personnelToOnLeave.region, '_id'),
                    subRegion  : _.pluck(this.personnelToOnLeave.subRegion, '_id'),
                    branch     : _.pluck(this.personnelToOnLeave.branch, '_id'),
                    phoneNumber: phoneNumber,
                    email      : email
                }, {
                    wait   : true,
                    success: function (cover) {
                        cover.set('fullName', cover.get('firstName').en + ' ' + cover.get('lastName').en);
                        collection = new Collection({fetch: false});
                        collection.reset(cover);

                        self.trigger('coverSaved', collection);
                    },
                    error  : function () {
                        App.render({
                            type   : 'error',
                            message: ERROR_MESSAGES.canNotSaveTemporaryEmployee[currentLanguage]
                        });
                    }
                });
            } else {
                App.render({
                    type   : 'error',
                    message: ERROR_MESSAGES.fillAllInputFields[currentLanguage]
                });
            }

        } else {
            App.render({
                type   : 'error',
                message: ERROR_MESSAGES.somethingWrongWithTabs[currentLanguage]
            });
        }
    },

    render: function () {
        var self = this;
        var $formString;
        var $phoneField;
        var $emailInput;

        $formString = $(this.template({
            translation: this.translation,
            title      : this.title
        }));

        $formString.find('#colleaguesInner').append(this.headerTemplate({
            notCheckAll   : true,
            showCheckboxes: true,
            translation   : this.translation
        }));

        this.$itemsEl = $formString.find('.listTable');

        $formString.append(new ListItemsView({
            el            : this.$itemsEl,
            collection    : this.collection,
            page          : this.page,
            showCheckboxes: true
        }).render());

        $phoneField = $formString.find('input.phoneNumber');
        $emailInput = $formString.find('input.email');

        $phoneField.inputmask('+999(99)-999-9999');
        $phoneField.attr('data-inputmask-clearmaskonlostfocus', false);
        $phoneField.attr('data-masked', true);

        $emailInput.inputmask({
            mask  : '*{1,20}[.*{1,20}][.*{1,20}][.*{1,20}]@*{1,20}[.*{2,6}][.*{1,2}]',
            greedy: false
        });

        this.$el = $formString.dialog({
            dialogClass: 'select-dialog heightEighty',
            width      : '80%',
            height     : '80%',
            buttons    : {
                save: {
                    text : self.translation.saveBtn,
                    class: 'btn saveBtn',
                    click: self.saveItem
                }
            }
        });

        this.delegateEvents();

        return this;
    },

    showMoreContent: function (newModels) {
        var $holder = this.$el;
        var itemView;

        this.pageAnimation(this.collection.direction, $holder);

        $holder.find('.listTable').empty();
        itemView = new ListItemsView({
            el            : this.$itemsEl,
            collection    : newModels,
            showCheckboxes: true,
            translation   : this.translation
        });

        $holder.append(itemView.render());
        itemView.undelegateEvents();

        $holder.find('#checkAll').prop('checked', false);
    }
});

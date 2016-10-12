define([
    'Backbone',
    'jQuery',
    'Underscore',
    'async',
    'text!templates/nestedContent/main.html',
    'views/baseDialog',
    'views/filter/dropDownView',
    'collections/origin/collection',
    'dataService',
    'js-cookie',
    'constants/errorMessages',
    'constants/contentType'
], function (Backbone, $, _, async, template,
             BaseView, DropDownView, OriginCollection, dataService, Cookies, ERROR_MESSAGES, CONTENT_TYPES) {

    var CreateView;
    var defaultTypes = {
        category: {
            index      : 0,
            editable   : true,
            templateDir: 'templates/itemsPrices/create/categoryAndVariant'
        },

        variant: {
            index      : 1,
            editable   : true,
            templateDir: 'templates/itemsPrices/create/categoryAndVariant'
        },

        item: {
            index      : 2,
            editable   : false,
            templateDir: 'templates/itemsPrices/create/item'
        }
    };
    CreateView = BaseView.extend({
        contentType: 'itemsPrices',
        template   : _.template(template),
        events     : {
            'click .addBtn'                                                                                                          : 'addNewRow',
            'click .flowSaveBtn'                                                                                                     : 'saveItem',
            'click .flowCancelBtn'                                                                                                   : 'cancelItem',
            'click .checkboxLabel'                                                                                                   : 'checked',
            "click .listBody input[type='checkbox']"                                                                                 : 'inputClick',
            'click .listBody tr'                                                                                                     : 'rowClick',
            'click .editBtn, .deleteBtn'                                                                                             : 'editDeleteChecked',
            'click #check_all_category, #check_all_competitorVariant, #check_all_variant, #check_all_item, #check_all_competitorItem': 'checkAll'
        },

        initialize: function (options) {
            var keys;
            var models;
            var collections;
            var self = this;
            var templates = [];

            this.translation = options.translation;
            this.tablesArray = [];
            this.types = options.types || defaultTypes;
            this.checkCountryDD = options.checkCountryDD;

            this.currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
            this.anotherLanguage = (this.currentLanguage === 'en') ? 'ar' : 'en';

            keys = Object.keys(this.types);

            keys.forEach(function (key) {
                var type = self.types[key];
                var index = type.index;
                var templateIndex = index * 3;

                self.tablesArray[index] = key;

                templates[templateIndex] = 'text!' + type.templateDir + '/header.html';
                templates[templateIndex + 1] = 'text!' + type.templateDir + '/list.html';
                templates[templateIndex + 2] = 'text!' + type.templateDir + '/newRow.html';
            });

            models = this.tablesArray.map(function (item) {
                return 'models/' + item;
            });

            collections = this.tablesArray.map(function (item) {
                return 'collections/' + item + '/collection';
            });

            async.parallel([
                this.loadTemplates.bind(this, templates),
                this.loadModels.bind(this, models),
                this.loadCollections.bind(this, collections)
            ], function () {
                self.makeRender();
                self.render();

                if (!options.notShowCategories) {
                    self.getAndDisplayCategories();
                }
            });

            this.on('brandSelect', function () {
                self.blockTables(0);
                self.getAndDisplayCategories();
            }, this);
        },

        checkAll: function (e) {
            var $el = $(e.target);
            var $table = $el.closest('table');
            var $checkboxes = $table.find('input[type="checkbox"]:not(#check_all_category, #check_all_competitorVariant, #check_all_competitorItem, #check_all_variant, #check_all_item)');
            var check = $el.prop('checked');

            if (this.editInProgress) {
                return e.preventDefault();
            }

            $checkboxes.prop('checked', check);
            this.inputClick(e);
        },

        loadTemplates: function (templates, cb) {
            var self = this;
            var keys = Object.keys(this.types);

            require(templates, function (categoryHeaderTemplate, categoryListTemplate, categoryRowTemplate,
                                         variantHeaderTemplate, variantListTemplate, variantRowTemplate,
                                         itemHeaderTemplate, itemListTemplate, itemRowTemplate) {
                self.templates = {};
                self.templates[keys[0]] = {
                    header: _.template(categoryHeaderTemplate),
                    list  : _.template(categoryListTemplate),
                    row   : _.template(categoryRowTemplate)
                };
                self.templates[keys[1]] = {
                    header: _.template(variantHeaderTemplate),
                    list  : _.template(variantListTemplate),
                    row   : _.template(variantRowTemplate)
                };
                self.templates[keys[2]] = {
                    header: _.template(itemHeaderTemplate),
                    list  : _.template(itemListTemplate),
                    row   : _.template(itemRowTemplate)
                };

                cb(null);
            });
        },

        loadModels: function (models, cb) {
            var self = this;

            require(models, function (FirstModel, NestedModel, LastNestedModel) {
                var newModels = {};

                newModels[self.tablesArray[0]] = FirstModel;
                newModels[self.tablesArray[1]] = NestedModel;
                newModels[self.tablesArray[2]] = LastNestedModel;

                self.models = newModels;

                cb(null);
            });
        },

        loadCollections: function (collections, cb) {
            var self = this;

            require(collections, function (FirstCollection, NestedCollection, LastNestedCollection) {
                var collections = {};

                collections[self.tablesArray[0]] = FirstCollection;
                collections[self.tablesArray[1]] = NestedCollection;
                collections[self.tablesArray[2]] = LastNestedCollection;

                self.collections = collections;

                cb(null);
            });
        },

        showHideButtons: function ($contentHolder, options) {
            var $btnHolder = $contentHolder.find('.categoryButtonWrap');
            var $btn;
            var inputOptions = options || {};

            for (var key in inputOptions) {
                $btn = $btnHolder.find('.' + key + 'Btn');
                $btn.toggle(!!inputOptions[key]);
            }
        },

        setFloatContainerPosition: function ($contentHolder, $row, id) {
            var rowPosition;
            var scrollableContainerPosition;
            var rowHeight;
            var floatPosition;
            var $scrollableContainer = $contentHolder.find('.mCSB_container');
            var $floatButtonsContainer = $contentHolder.find('.floatButtonsContainer');

            rowPosition = $row.position();
            rowHeight = $row.height();
            scrollableContainerPosition = $scrollableContainer.position();

            if (id) {
                floatPosition = scrollableContainerPosition.top + rowPosition.top + rowHeight + rowHeight / 2 - $floatButtonsContainer.height() / 2;
            } else {
                floatPosition = rowHeight + rowHeight / 2 - $floatButtonsContainer.height() / 2;
            }

            $floatButtonsContainer.css({top: floatPosition});
            $floatButtonsContainer.attr('data-id', id);
            $floatButtonsContainer.show();
        },

        /*region UI handlers*/
        addNewRow: function (e) {
            var $target = $(e.target);
            var $contentHolder = $target.closest('.dialogCategoryItem');
            var content = $contentHolder.attr('data-content');
            var template = this.templates[content].row;
            var $newRow = $(template({
                currentLanguage: this.currentLanguage,
                anotherLanguage: this.anotherLanguage,
                translation    : this.translation
            }));
            var classToFindForWrap;
            var $wrapHolder;

            if (this.editInProgress) {
                return;
            }

            if (content === 'competitorItem' || content === 'item') {
                classToFindForWrap = content === CONTENT_TYPES.ITEM ? '.dialogItemWrap' : '.dialogCompetitorWrap';
                this.originCollection = new OriginCollection({
                    count: -1
                });
                this.originDropDownView = new DropDownView({
                    forPosition : true,
                    dropDownList: this.originCollection,
                    displayText : this.translation.origin,
                    multiSelect : true
                });

                $newRow.find('.originDropDown').append(this.originDropDownView.el);
                $wrapHolder = $contentHolder.closest(classToFindForWrap);
                $wrapHolder.find('#countryDropDown').removeClass('hidden');
            }

            $contentHolder.find('.listBody').prepend($newRow);
            $contentHolder.find('input[type="checkbox"]').attr('readonly', 'readonly');
            $contentHolder.find('.scrollable').mCustomScrollbar('scrollTo', 'top');
            this.setFloatContainerPosition($contentHolder, $newRow, false);
            this.showHideButtons($contentHolder, {add: false, delete: false, edit: false});

            $newRow.addClass('clicked').siblings().removeClass('clicked');

            this.editInProgress = true;
            this.trigger('editInProgress', this.editInProgress);
        },

        saveItem: function (e) {
            var $target = $(e.target);
            var $floatButtonsContainer = $target.closest('.floatButtonsContainer');
            var rowId = $floatButtonsContainer.attr('data-id');
            var $contentHolder = $target.closest('.dialogCategoryItem');
            var $row = $contentHolder.find('#' + rowId).closest('tr');
            var $inputs = $row.find('input');
            var content = $contentHolder.attr('data-content');
            var model = new this.models[content]();
            var defaultValues = this.types[content].defaultValues;
            var dataObject = {};
            var self = this;
            var prevContent = this.getPrevContent(content);
            var prevModel;
            var prePrevContent;
            var name;
            var origin;
            var packing;


            $inputs.each(function (index, element) {
                var $element = $(element);
                var value = $element.val();
                var keyAttr = $element.attr('data-key');
                var languageAttr = $element.attr('data-language');

                if (languageAttr) {
                    dataObject[keyAttr] = dataObject[keyAttr] || {};
                    dataObject[keyAttr][languageAttr] = value;
                } else if (keyAttr) {
                    dataObject[keyAttr] = value;
                }
            });

            dataObject.country = this.selectedCountry;
            if ([CONTENT_TYPES.ITEM, CONTENT_TYPES.COMPETITORITEM].indexOf(content) !== -1 && !dataObject.country) {
                return App.render({
                    type   : 'error',
                    message: ERROR_MESSAGES.selectCountryDD[this.currentLanguage]
                });
            }

            if (content === 'competitorItem' || content === 'item') {
                dataObject.origin = this.originCollection.getSelected({ids: true});
                dataObject.brand = this.brandId;
            }

            if (rowId === 'false') {
                delete dataObject._id;
            }

            if (prevContent) {
                dataObject[prevContent.content] = this[prevContent.content];
                //todo check why?
                if (content === 'item') {
                    prePrevContent = this.getPrevContent(prevContent.content);
                    dataObject[prePrevContent.content] = this[prePrevContent.content];
                }
            }

            if (defaultValues) {
                _.extend(dataObject, defaultValues);
            }

            model.setFieldsNames(this.translation);

            model.save(dataObject, {
                patch  : true,
                wait   : true,
                success: function (model, response) {
                    var id = model.id;
                    var $checkbox = $row.find('input:checkbox');
                    var $label = $row.find('label');
                    var originsNameArr;
                    var selectedOrigin;
                    var collection;

                    $contentHolder.find('input[type="checkbox"]').removeAttr('readonly');
                    $checkbox.attr('id', id);
                    $checkbox.val(id);
                    $checkbox.prop('checked', false);
                    $label.attr('for', id);
                    $row.removeClass('editting');
                    $row.find('input').not($checkbox).attr('readonly', 'readonly');
                    $row.find('.displayable').val(model.get('name').currentLanguage);
                    self.showHideButtons($contentHolder, {add: true});
                    $floatButtonsContainer.hide();
                    $floatButtonsContainer.removeAttr('data-id');

                    if (content === 'competitorItem' || content === 'item') {
                        selectedOrigin = self.originCollection.getSelected({json: true});
                        originsNameArr = self.originCollection.getSelected({names: true});
                        originsNameArr = _.map(originsNameArr, function (originName) {
                            return originName.currentLanguage
                        });
                        $row.find('.originDropDown').html(originsNameArr.join(', '));

                        self.trigger('itemSaved', model);

                        collection = self[content];
                        model = _.findWhere(collection, {_id: id});

                        if (model) {
                            model.origin = selectedOrigin;
                        } else {
                            collection.push(response);
                        }

                        if (content === 'competitorItem' || content === 'item') {
                            self.trigger('setCountry', null);
                        }
                    }

                    self.editInProgress = false;
                    self.trigger('editInProgress', self.editInProgress);

                    $row.click();
                },
                error  : function (model, xhr) {
                    App.render({type: 'error', message: xhr.responseText});
                }
            });

        },

        cancelItem: function (e) {
            var $target = $(e.target);
            var $floatButtonsContainer = $target.closest('.floatButtonsContainer');
            var rowId = $floatButtonsContainer.attr('data-id');

            var $contentHolder = $target.closest('.dialogCategoryItem');
            var $wrapHolderItem = $contentHolder.closest('.dialogItemWrap');
            var $wrapHolderCompetitor = $contentHolder.closest('.dialogCompetitorWrap');
            var $row = $contentHolder.find('#' + rowId).closest('tr');
            var $inputs;
            var content;
            var $checkbox;
            var originsNameArr;
            var collection;

            $wrapHolderItem.length ? $wrapHolderItem.find('#countryDropDown').addClass('hidden') : $wrapHolderCompetitor.find('#countryDropDown').addClass('hidden');

            if (rowId !== 'false') {
                $checkbox = $row.find('input:checkbox');
                $inputs = $row.find('input:not([type="checkbox"])');
                content = $contentHolder.attr('data-content');

                $inputs.each(function (index, element) {
                    var $element = $(element);
                    var prevVal = $element.attr('data-content');

                    $element
                        .attr('readonly', 'readonly')
                        .val(prevVal)
                        .attr('data-content', '');

                    $row.removeClass('editting');
                    $checkbox.prop('checked', false);
                });

                if (content === 'competitorItem' || content === 'item') {
                    rowId = $checkbox.attr('id');
                    collection = this[content];
                    model = _.findWhere(collection, {_id: rowId});
                    originsNameArr = _.map(model.origin, function (origin) {
                        return origin.name.currentLanguage
                    });

                    $row.find('.originDropDown').html(originsNameArr.join(', '));
                }
            } else {
                if (content === 'competitorItem' || content === 'item') {
                    this.trigger('setCountry', null);
                }

                $row.remove();
            }

            $contentHolder.find('input[type="checkbox"]').removeAttr('readonly');
            this.showHideButtons($contentHolder, {add: true});
            $floatButtonsContainer.hide();
            $floatButtonsContainer.removeAttr('data-id');

            this.editInProgress = false;
            this.trigger('editInProgress', this.editInProgress);
        },

        checked: function (e) {
            e.stopPropagation();
        },

        inputClick: function (e) {
            var $currentChecked = $(e.target);
            var $contentHolder = $currentChecked.closest('.dialogCategoryItem');
            var $checkBoxes = $contentHolder.find('input[type="checkbox"]:checked:not(#check_all_category, #check_all_competitorVariant, #check_all_competitorItem, #check_all_variant, #check_all_item)');
            var checkBoxesLength = $checkBoxes.length;
            var content = $contentHolder.attr('data-content');

            var showEdit = checkBoxesLength && checkBoxesLength === 1;
            var showDelete = !!checkBoxesLength;

            e.stopPropagation();

            if (this.editInProgress) {
                return e.preventDefault();
            }

            this.showHideButtons($contentHolder, {edit: showEdit, delete: showDelete});
        },

        rowClick: function (e) {
            var self = this;
            var $target = $(e.target);
            var $row = $target.closest('tr');
            var $checbox = $row.find('input[type="checkbox"]');
            var rowId = $checbox.attr('id');
            var $contentHolder = $row.closest('.dialogCategoryItem');
            var content = $contentHolder.attr('data-content');
            var defaultFilter = this.types[content].defaultFilter;
            var nextContent = this.getNextContent(content);
            var searchObject = {
                archived: 'false',
                count   : -1
            };
            var currentLanguage = App.currentUser.currentLanguage;
            var contentCollection;
            var collection;
            var model;

            if (this.editInProgress) {
                return;
            }

            if ($row.hasClass('editting')) {
                return false;
            }

            $row.addClass('clicked').siblings().removeClass('clicked');

            if (content === 'competitorItem' || content === 'item') {
                collection = this[content];
                model = _.findWhere(collection, {_id: rowId});

                this.trigger('setCountry', model.country);
                // TODO: Remove comment when bug QPCMS-1930 will be completed
                // } else {
                //     this.trigger('setCountry', null);
            }

            if (content !== 'competitorItem' && content !== 'item') {
                this[content] = rowId;
            }

            self.$el.find('.floatButtonsContainer').each(function () {
                var $floatButtonsContainer = $(this);

                if ($floatButtonsContainer.attr('data-id')) {
                    $floatButtonsContainer.find('.flowCancelBtn').click();
                }
            });

            if (!nextContent) {
                return;
            }

            searchObject[content] = rowId;

            if (defaultFilter) {
                _.extend(searchObject, defaultFilter);
            }

            if (this.brandId && content === 'competitorVariant') {
                searchObject.brand = this.brandId;
            }

            contentCollection = new this.collections[nextContent.content](searchObject);

            contentCollection.on('showMore', function (collection) {
                var jsonCollection = collection.toJSON();

                self[nextContent.content] = jsonCollection;
                self.renderTableList({name: nextContent.content, data: jsonCollection});
                self.blockTables(nextContent.index);
            });

            contentCollection.on('errorPagination', function () {
                App.render({
                    type   : 'error',
                    message: ERROR_MESSAGES.canNotGet[currentLanguage] + content.capitalizer('firstCaps')
                });
            });
        },

        editDeleteChecked: function (e) {
            var $target = $(e.target);
            var $contentHolder = $target.closest('.dialogCategoryItem');
            var $wrapHolderItem = $contentHolder.closest('.dialogItemWrap');
            var $wrapHolderCompetitor = $contentHolder.closest('.dialogCompetitorWrap');
            var content = $contentHolder.attr('data-content');
            var $checkboxes = $contentHolder.find('input[type="checkbox"]:checked:not(#check_all_' + content + ')');
            var model = new this.models[content]();
            var url = model.urlRoot() + '/remove/';
            var $row;
            var rowId;
            var collection;
            var self = this;
            var $item;
            var ids = [];
            var data;

            if (this.editInProgress) {
                return;
            }

            if ($target.hasClass('editBtn')) {
                $row = $checkboxes.closest('tr');
                $contentHolder.find('input[type="checkbox"]').attr('readonly', 'readonly');
                $row.click();

                $row.find('input').not($checkboxes).each(function (index, element) {
                    var $element = $(element);

                    $element.removeAttr('readonly');
                    $element.attr('data-content', $element.val());
                });

                $row.addClass('editting');

                if (content === 'competitorItem' || content === 'item') {
                    $wrapHolderItem.length ? $wrapHolderItem.find('#countryDropDown').removeClass('hidden') : $wrapHolderCompetitor.find('#countryDropDown').removeClass('hidden');
                    rowId = $checkboxes.attr('id');
                    collection = this[content];
                    model = _.findWhere(collection, {_id: rowId});

                    this.originCollection = new OriginCollection({
                        count: -1
                    });
                    this.originDropDownView = new DropDownView({
                        forPosition   : true,
                        dropDownList  : this.originCollection,
                        displayText   : 'Origin',
                        multiSelect   : true,
                        selectedValues: model.origin
                    });

                    $row.find('.originDropDown').html('').append(this.originDropDownView.el);

                    this.trigger('setCountry', model.country);
                }

                this.showHideButtons($contentHolder, {add: false, delete: false, edit: false});
                this.setFloatContainerPosition($contentHolder, $row, $checkboxes.attr('id'));

                $row.addClass('clicked').siblings().removeClass('clicked');

                this.editInProgress = true;
                this.trigger('editInProgress', this.editInProgress);
            } else {
                $wrapHolderItem.length ? $wrapHolderItem.find('#countryDropDown').addClass('hidden') : $wrapHolderCompetitor.find('#countryDropDown').addClass('hidden');

                $checkboxes.each(function (key, item) {
                    $item = $(item);
                    ids.push($item.attr('id'));
                });

                data = {
                    ids     : ids,
                    archived: true
                };

                dataService.putData(url, data, function (err) {
                    if (err) {
                        return App.render({type: 'error', message: err.responseText});
                    }

                    var $rows = $checkboxes.closest('tr');

                    $rows.remove();
                    self.blockTables(0);
                    self.showHideButtons($contentHolder, {delete: false, edit: false});

                    if (content === 'competitorVariant') {
                        self.blockTables(1);
                    }

                    return App.render({
                        type   : 'notification',
                        message: self.translation.all + ' ' + ERROR_MESSAGES.elementsWasDeleted[self.currentLanguage]
                    });
                });
            }
        },

        renderTable: function (options) {
            var $container = options.element || this.$el;
            var name = options.name;
            var template;

            if (name) {
                template = this.templates[name].header;

                $container
                    .find('#' + name + 'Holder')
                    .html('')
                    .addClass('tableBlocked')
                    .append(template({
                            title      : this.translation[name],
                            editable   : this.types[name].editable,
                            translation: this.translation
                        })
                    );
            }
        },

        renderTableList: function (options) {
            var $curEl = this.$el;
            var name = options.name;
            var template = this.templates[name].list;
            var data = options.data || [];
            var $contentHolder = $curEl.find('#' + name + 'Holder');

            $contentHolder
                .removeClass('tableBlocked')
                .find('.listBody')
                .html('')
                .append(template({
                        items          : data,
                        currentLanguage: this.currentLanguage,
                        anotherLanguage: this.anotherLanguage,
                        translation    : this.translation
                    })
                );

            this.showHideButtons($contentHolder, {add: true, delete: false, edit: false});
        },

        getNextContent: function (content) {
            var array = this.tablesArray;
            var curContentIndex = array.indexOf(content);
            var nextContentIndex = curContentIndex + 1;
            var nextContent = array[nextContentIndex];

            if (nextContent) {
                return {content: nextContent, index: nextContentIndex};
            }

            return false;
        },

        getPrevContent: function (content) {
            var array = this.tablesArray;
            var curContentIndex = array.indexOf(content);
            var prevContentIndex = curContentIndex - 1;
            var prevContent = array[prevContentIndex];

            if (prevContent) {
                return {content: prevContent, index: prevContentIndex};
            }

            return false;
        },

        blockTables: function (index) {
            var $curEl = this.$el;
            var array = this.tablesArray;
            var length = array.length;
            var content;
            var $contentHolder;
            var i;

            for (i = length;
                 i > index;
                 i--) {
                content = array[i];
                $contentHolder = $curEl.find('#' + content + 'Holder');
                $contentHolder.addClass('tableBlocked');
                $contentHolder.find('.listBody').html('');

                this.showHideButtons($contentHolder, {add: false, delete: false, edit: false});
            }

            $curEl
                .find('#' + array[index] + 'Holder')
                .removeClass('tableBlocked');
        },

        getAndDisplayCategories: function () {
            var self = this;
            var categoryCollection = new this.collections.category({archived: false});
            var currentLanguage = App.currentUser.currentLanguage;

            categoryCollection.on('showMore', function (categories) {
                self.renderTableList({name: 'category', data: categories.toJSON()});
            });

            categoryCollection.on('errorPagination', function () {
                App.render({type: 'error', message: ERROR_MESSAGES.canNotGetCategories[currentLanguage]});
            });
        },

        render: function () {
            var self = this;
            var $formString = $(this.template({
                contents   : this.tablesArray,
                translation: this.translation
            }));
            this.tablesArray.forEach(function (type) {
                self.renderTable({
                    name       : type,
                    element    : $formString,
                    translation: self.translation
                });
            });

            this.$el.html($formString);

            return this;
        }
    });
    return CreateView;
});

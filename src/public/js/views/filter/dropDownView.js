var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Cookies = require('js-cookie');
var dropDownTemplate = require('../../../templates/filter/dropDown.html');
var dropDownContentTemplate = require('../../../templates/filter/dropDownContent.html');
var filterCollection = require('../../collections/filter/filterCollection');
var FILTERSCONSTANTS = require('../../constants/filters');
var App = require('../../appState');

module.exports = Backbone.View.extend({
    template       : _.template(dropDownTemplate),
    contentTemplate: _.template(dropDownContentTemplate),

    events: {
        'click .dropDownInput>input'                 : 'inputClick',
        'input .dropDownInput>input:not(.createOwn)' : 'inputChange',
        'blur .dropDownInput>input'                  : 'inputBlur',
        'click .downArrow'                           : 'toggleDropDownContent',
        'click .dropDownItem'                        : 'itemClick',
        'click .dropDownPagination a'                : 'paginationChange',
        'click .counter'                             : 'stopPropagation',
        'click #select-all'                          : 'selectAllValues'
    },

    searchText       : '',
    selectedValues   : [],
    selectedValuesIds: [],

    initialize: function (options) {
        var self = this;

        this.forPosition = options.forPosition === undefined ? true : options.forPosition;
        this.displayText = options.displayText;
        this.contentType = options.contentType;
        this.notRender = options.notRender;
        this.dataProperty = options.dataProperty || null;
        this.collection = options.dropDownList.toJSON ? options.dropDownList : new filterCollection(options.dropDownList);
        this.collectionLength = this.collection.length;
        this.elementToShow = options.elementToShow || FILTERSCONSTANTS.FILTER_VALUES_COUNT;
        this.noSingleSelectEvent = options.noSingleSelectEvent;
        this.noAutoSelectOne = options.noAutoSelectOne;
        this.showSelectAll = options.showSelectAll;

        this.filteredCollection = new filterCollection(this.collection.toJSON());

        this.currentPage = 1;
        this.filteredCollectionLength = this.filteredCollection.length;
        this.allPages = Math.ceil(this.filteredCollectionLength / this.elementToShow);

        this.collection.on('reset', function () {
            if (!self.collection.length) {
                self.removeSelected();
            }

            if (this.showSelectAll) {
                $('#select-all-li-' + self.contentType).removeClass('checkedValue');
                $('.dropDownItem.selected').removeClass('selected');
            }

            if (self.checkAll) {
                self.collection.forEach(function (model) {
                    model.set({selected: true});
                });
            } else {
                self.selectedValuesIds.forEach(function (value, index) {
                    var model = self.collection.get(value);

                    if (model) {
                        model.set({selected: true});
                    } else {
                        delete self.selectedValuesIds[index];
                        delete self.selectedValues[index];
                        self.setSelected();
                    }
                });
            }
            self.filteredCollection.reset(self.collection.toJSON());
        });

        this.filteredCollection.on('reset', function () {
            var model;
            var $selector;

            self.currentPage = 1;
            self.filteredCollectionLength = self.filteredCollection.length;
            self.allPages = Math.ceil(self.filteredCollectionLength / self.elementToShow);

            if (self.filteredCollectionLength === 1 && !self.noAutoSelectOne) {
                self.setSelectedByIds({
                    ids : [self.filteredCollection.at(0).get('_id')],
                    auto: true
                });

                if (!self.noSingleSelectEvent) {
                    model = self.filteredCollection.at(0);
                    $selector = self.$el.find('.grayDropdownInput');

                    self.trigger('changeItem', {
                        contentType      : self.contentType,
                        $item            : self.$el,
                        model            : model.toJSON(),
                        selectedValuesIds: self.selectedValuesIds,
                        $selector        : $selector
                    });
                }
            } else {
                self.renderContent();
            }
        });

        this.on('setSelectedByIds', this.setSelectedByIds, this);

        this.multiSelect = options.multiSelect || false;
        this.singleUnselect = options.singleUnselect || false;
        this.selectedValuesIds = options.selectedValuesIds || _.pluck(options.selectedValues, '_id') || [];
        this.selectedValues = options.selectedValuesIds ? options.selectedValues : _.pluck(options.selectedValues, 'name') || [];

        this.render();
    },

    selectAllValues : function (event) {
        var selectAllLi = $(event.target).parent();
        var isSelectedSelectAll = selectAllLi.hasClass('checkedValue');

        if (isSelectedSelectAll) {
            this.removeSelected();

            $('.dropDownItem.selected').removeClass('selected');
            selectAllLi.removeClass('checkedValue');
        } else {
            var arrayOfIds = this.collection.toJSON().map(function(model) {
                return model._id;
            });

            this.setSelectedByIds({
                ids: arrayOfIds
            });

            selectAllLi.addClass('checkedValue');
        }

        this.trigger('changeItem', {
            selectedValuesIds: this.selectedValuesIds
        });
    },

    removeSelected: function (e) {
        var $input = this.$el.find('.dropDownInput>input');

        $input.val('');
        $input.attr('data-id', '');
        this.selectedValues = [];
        this.selectedValuesIds = [];
    },

    inputClick: function (e) {
        var $input = $(e.target);

        $input.val('');

        if (this.searchText) {
            $input.val(this.searchText);
            this.filteredCollection.reset(this.collectionFilter(this.searchText));
        }

        this.stopPropagation(e);
    },

    setSelected: function (options) {
        var $input = this.$el.find('.dropDownInput>input');
        var names = [];
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ||
            Cookies.get('currentLanguage') || 'en';
        var anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';
        var self = this;
        var selectedValues;
        var selectedValuesIds;
        var model;

        selectedValues = _.compact(this.selectedValues);
        selectedValues.forEach(function (name, index) {
            names.push(name.currentLanguage || name[currentLanguage] || name[anotherLanguage] || name);
        });

        $input.val(names.join(', '));
        selectedValuesIds = _.compact(this.selectedValuesIds);
        model = this.collection.get(selectedValuesIds[0]);
        if (model && model.get('auto')) {
            $input.attr('data-auto', true);
        }
        $input.attr('data-id', selectedValuesIds.join(','));
        if (selectedValuesIds[0] === 'other' && this.contentType === 'displayType'){
            $input.addClass('createOwn');
        }
    },

    setSelectedByIds: function (options) {
        var ids = options.ids || [];
        var self = this;
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ||
            Cookies.get('currentLanguage') || 'en';
        var anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

        this.selectedValues = [];
        this.selectedValuesIds = [];

        ids.forEach(function (id) {
            var model = self.collection.get(id);
            var name;

            if (!model) {
                return false;
            }

            name = model.get('name');

            model.set({selected: true});
            if (options.auto) {
                model.set({auto: true});
            }

            self.selectedValues.push(name.currentLanguage || name[currentLanguage] || name[anotherLanguage] || name);
            self.selectedValuesIds.push(model.get('_id'));
        });

        this.setSelected();
        this.renderContent();
    },

    collectionFilter: function (value) {
        var resultCollection;
        var regex;

        regex = new RegExp(value, 'i');

        resultCollection = this.collection.filter(function (model) {
            var name = model.get('name');

            if ((name.en && name.en.match(regex)) || (name.ar && name.ar.match(regex)) || (typeof name === 'string' && name.match(regex))) {
                return model;
            }
        });

        return resultCollection;
    },

    stopPropagation: function (e) {
        e.stopPropagation();
    },

    inputChange: function (e) {
        this.stopPropagation(e);
        this.toggleDropDownContent(e, true);
        this.searchText = e.target.value;
        this.filteredCollection.reset(this.collectionFilter(this.searchText));
    },

    inputBlur: function (e) {
        var $input = this.$el.find('.dropDownInput>input');

        if (this.searchText) {
            $input.val(this.searchText);
        } else {
            this.setSelected();
        }
    },

    toggleDropDownContent: function (e, show) {
        if (e) {
            this.stopPropagation(e);
        }

        var $curEl = this.$el;
        var $forPosition = $curEl.find('.forPosition');
        var $curDropDownContent = $curEl.find('.dropDownContent');
        var $parent = $curDropDownContent.closest('.dropDownInputWrap');
        var $absoluteContent = $curDropDownContent.closest('.absoluteContent');
        var height = $parent.outerHeight() + 3;
        var dropDownPosition = $parent.offsetLeft + height;

        var $curUl;
        var curUlHeight;
        var curUlOffset;
        var $window = $(window);
        var direction;

        if (show || !$parent.hasClass('openDd') || !$parent.hasClass('openDdReverse')) {
            this.$el.click();
        }

        if (!this.className) {
            $curUl = $parent.find('.dropDownList');
            curUlOffset = $curUl.offset();
            curUlHeight = $curUl.outerHeight();
            direction = curUlOffset.top + curUlHeight > $window.scrollTop() + $window.height();
            this.className = direction ? 'openDdReverse' : 'openDd';
        }

        $parent.toggleClass(this.className, show);

        // if ($absoluteContent.length) {
        $forPosition.width($parent.width());
        $forPosition.css({top: dropDownPosition});
        // }
    },

    itemClick: function (e) {
        var $el = $(e.target);
        var itemId = $el.attr('id');
        var $selector = this.$el.find('.grayDropdownInput');
        var model = this.collection.get(itemId);
        var selected;
        var modelIndex;
        var modelName = model.get('name');
        var prevModel;
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ||
            Cookies.get('currentLanguage') || 'en';
        var anotherLanguage = currentLanguage === 'en' ? 'ar' : 'en';

        modelName = modelName[currentLanguage] || modelName[anotherLanguage] || modelName;

        this.stopPropagation(e);

        modelIndex = this.selectedValuesIds.indexOf(itemId);
        selected = modelIndex === -1;

        if (this.multiSelect) {
            if (selected) {
                this.selectedValuesIds.push(itemId);
                this.selectedValues.push(modelName);

                model.set('selected', true);
                $el.addClass('selected');
            } else {
                this.selectedValuesIds.splice(modelIndex, 1);
                this.selectedValues.splice(modelIndex, 1);

                model.set('selected', false);
                $el.removeClass('selected');
            }

            if (this.selectedValues.length === this.collection.length) {
                $('#select-all-li-' + this.contentType).addClass('checkedValue');
            } else {
                $('#select-all-li-' + this.contentType).removeClass('checkedValue');
            }

            this.trigger('changeItem', {
                contentType      : this.contentType,
                $item            : $el,
                selectedValuesIds: this.selectedValuesIds,
                $selector        : $selector
            });

        } else {
            if (this.selectedValuesIds.length) {
                prevModel = this.collection.get(this.selectedValuesIds[0]);
                if (prevModel) {
                    prevModel.set('selected', false);
                }
                $el.closest('.dropDownItems').find('.selected').removeClass('selected');
            }

            if (this.singleUnselect) {
                if (selected) {
                    this.selectedValuesIds = [itemId];
                    this.selectedValues = [modelName];

                    $el.addClass('selected');
                } else {
                    this.selectedValuesIds = [];
                    this.selectedValues = [];

                    model = new Backbone.Model();
                    $el.removeClass('selected');
                }
            } else {
                this.selectedValuesIds = [itemId];
                this.selectedValues = [modelName];

                $el.addClass('selected');
            }

            this.toggleDropDownContent(e, false);

            this.trigger('changeItem', {
                contentType: this.contentType,
                $item      : $el,
                model      : model.toJSON(),
                $selector  : $selector
            });
        }

        if (this.searchText) {
            this.searchText = '';
            this.filteredCollection.reset(this.collectionFilter(this.searchText));
        }

        this.setSelected();
    },

    makePagination: function ($paginationEl, status) {
        var $prevPage;
        var $nextPage;

        if (status) {
            $paginationEl.find('.counter').html((this.start + 1) + '-' + this.end + ' of ' + this.filteredCollection.length);
            $paginationEl.show();
        } else {
            $paginationEl.hide();
        }

        $prevPage = $paginationEl.find('.prev');
        $nextPage = $paginationEl.find('.next');

        if (this.currentPage === 1) {
            $prevPage.addClass('disabled');
            $nextPage.removeClass('disabled');
        } else if (this.currentPage === this.allPages) {
            $prevPage.removeClass('disabled');
            $nextPage.addClass('disabled');
        } else {
            $prevPage.removeClass('disabled');
            $nextPage.removeClass('disabled');
        }
    },

    paginationChange: function (e) {
        var $curEl = $(e.target);

        this.stopPropagation(e);

        if ($curEl.hasClass('disabled')) {
            return;
        }

        if ($curEl.hasClass('prev')) {
            this.currentPage--;
        } else {
            this.currentPage++;
        }

        this.renderContent();
    },

    clearDropDown: function () {
        this.collection.reset();
        this.$el.find('.dropDownInput>input').val('');
    },

    renderContent: function () {
        var $thisEl = this.$el;
        var $dropDownList = $thisEl.find('.dropDownItems');
        var $dropDownPagination = $thisEl.find('.dropDownPagination');
        var displayCollection;
        var paginationBool;
        var selectedModelsIds = this.selectedValuesIds;
        var $input = this.$el.find('.dropDownInput>input');

        this.start = (this.currentPage - 1) * this.elementToShow;
        this.end = Math.min(this.currentPage * this.elementToShow, this.filteredCollectionLength);

        displayCollection = this.filteredCollection.toJSON().slice(this.start, this.end);

        _.map(displayCollection, function (model) {
            if (selectedModelsIds.indexOf(model._id) === -1) {
                return model;
            }

            model.selected = true;

            return model;
        });

        $dropDownList.html(this.contentTemplate({
            dropDownList: displayCollection
        }));

        paginationBool = (this.filteredCollectionLength - this.elementToShow > 0);

        this.makePagination($dropDownPagination, paginationBool);
    },

    render: function () {
        var $curEl = this.$el;

        $curEl.html(this.template({
            displayText : this.displayText,
            forPosition : this.forPosition,
            contentType : this.contentType,
            dataProperty: this.dataProperty,
            showSelectAll : this.showSelectAll
        }));

        if (this.selectedValuesIds.length) {
            this.setSelected();
        }

        return this;
    }

});

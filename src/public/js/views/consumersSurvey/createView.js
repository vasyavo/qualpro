var $ = require('jquery');
var _ = require('underscore');
var moment = require('moment');
var CreateTemplate = require('../../../templates/consumersSurvey/create.html');
var CreateConsumersSurveyViewTemplate = require('../../../templates/consumersSurvey/createQuestionView.html');
var circleRadioButtonsTemplate = require('../../../templates/consumersSurvey/circle-radio-buttons.html');
var MultiSelectOptionsTemplate = require('../../../templates/consumersSurvey/multiselectOptions.html');
var SingleSelectOptionsTemplate = require('../../../templates/consumersSurvey/singleSelectOptions.html');
var ListOptionTemplate = require('../../../templates/consumersSurvey/listOption.html');
var FullAnswerOptionsTemplate = require('../../../templates/consumersSurvey/fullAnswerOptions.html');
var DropDownView = require('../../views/filter/dropDownView');
var Model = require('../../models/consumersSurvey');
var QuestionModel = require('../../models/question');
var FilterCollection = require('../../collections/filter/filterCollection');
var QuestionCollection = require('../../collections/consumersSurvey/questionCollection');
var OTHER_CONSTANTS = require('../../constants/otherConstants');
var CONTENT_TYPES = require('../../constants/contentType');
var BaseView = require('../../views/baseDialog');
var custom = require('../../custom');
var implementShowHideArabicInputIn = require('../../helpers/implementShowHideArabicInputIn');
var App = require('../../appState');

module.exports = BaseView.extend({
    contentType: 'createConsumersSurvey',

    template                         : _.template(CreateTemplate),
    createConsumersSurveyViewTemplate: _.template(CreateConsumersSurveyViewTemplate),
    fullAnswerOptionsTemplate        : _.template(FullAnswerOptionsTemplate),
    multiSelectOptionsTemplate       : _.template(MultiSelectOptionsTemplate),
    singleSelectOptionsTemplate      : _.template(SingleSelectOptionsTemplate),
    listOptionTemplate               : _.template(ListOptionTemplate),
    someIdForCheckBox                : 0,
    create                           : false,

    events: {
        'click #addConsumersSurvey'                                            : 'addConsumersSurvey',
        'click #deleteConsumersSurvey'                                         : 'deleteConsumersSurvey',
        'click #consumersSurveyTable .js_question .js_options .js_addNewOption': 'addNewOption',
        'click #consumersSurveyTable .js_question .js_options .removeOption'   : 'removeOption',
        'click #consumersSurveyTable .js_question input[type="checkbox"]'      : 'checkBoxClick',
        'input #consumersSurveyTable .js_question input'                       : 'changeValue',
        'click .filterHeader'                                                  : 'toggleFilterHolder'
    },

    initialize: function (options) {
        var model = options.model ? options.model.toJSON() : null;

        this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
        this.translation = options.translation;
        this.edit = options.edit;
        this.valueWasChanged = false;

        if (!this.edit && model) {
            // for duplicate
            delete model._id;
            delete model.title;
            delete model.dueDate;
            delete model.startDate;
            this.model = new Model(model);
            this.questionsCollection = new QuestionCollection(model.questions);
            this.renderModel = true;
        } else if (model) {
            // for edit
            this.model = new Model(model);
            this.questionsCollection = new QuestionCollection(model.questions);
            this.renderModel = true;
        } else {
            // for create
            this.model = new Model();
            this.renderModel = false;
            this.create = true;
        }

        options.dialog = true;
        options.contentType = this.contentType;

        _.bind(this.saveQuestionnary, this);
        this.makeRender(options);
        this.render();
    },

    changeValue: function () {
        this.valueWasChanged = true;
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

    checkBoxClick: function () {
        var $checkbox = this.$el.find('#consumersSurveyTable input[type="checkbox"]:checked');

        this.showHideButtons({
            add   : true,
            delete: !!$checkbox.length
        });
    },

    addNewOption: function (e, $optionsContainer, option) {
        var $el;
        var $list;

        if (e) {
            e.preventDefault();
            $el = $(e.target);
            $optionsContainer = $el.closest('.js_question').find('.js_options');
        }

        $list = $optionsContainer.find('.js_optionsList');
        $list.append(this.listOptionTemplate({
            option     : option || '',
            translation: this.translation,
            App        : App,
        }));
    },

    removeOption: function (e) {
        var $el = $(e.target);
        var $option = $el.closest('.option');

        e.preventDefault();

        $option.remove();
    },

    addConsumersSurvey: function (e, question) {
        var $curEl = this.$el;
        var questionTypeDropDownView;
        var $questionContainer;
        var dropDownCreationOptions = {
            forPosition : true,
            dropDownList: new FilterCollection(),
            displayText : this.translation.questionType,
            multiSelect : false,
            notRender   : true
        };

        if (e) {
            e.preventDefault();
        }

        this.someIdForCheckBox++;
        $curEl.find('#consumersSurveyTable').append(this.createConsumersSurveyViewTemplate({
            question         : question || {},
            someIdForCheckBox: this.someIdForCheckBox,
            translation      : this.translation,
            App              : App,
        }));

        if (question) {
            var questionType = (question.type._id) ? question.type._id : question.type;
            dropDownCreationOptions.selectedValues = [_.findWhere(OTHER_CONSTANTS.CONSUMER_SURVEY_QUESTION_TYPE, {_id: questionType})];

            if (questionType === 'NPS') {

            }
        }

        questionTypeDropDownView = new DropDownView(dropDownCreationOptions);

        questionTypeDropDownView.on('changeItem', this.selectStatus, this);
        questionTypeDropDownView.render();
        dropDownCreationOptions.dropDownList.reset(OTHER_CONSTANTS.CONSUMER_SURVEY_QUESTION_TYPE);

        $questionContainer = $curEl.find('#id' + this.someIdForCheckBox).closest('.js_question');
        $questionContainer.find('.js_questionType').append(questionTypeDropDownView.el);

        if (question) {
            this.renderOptionsForDuplicate(question, $questionContainer);
        }
    },

    renderOptionsForDuplicate: function (question, $questionContainer) {
        var $optionsContainer = $questionContainer.find('.js_options');
        var questionType = (question.type._id) ? question.type._id : question.type;

        this.renderOptionsContainer(questionType, $optionsContainer, question.options);
    },

    renderOptionsContainer: function (questionType, $optionsContainer, questionOptions) {
        var self = this;

        if (questionType === 'multiChoice') {
            $optionsContainer.html(this.multiSelectOptionsTemplate());
        } else if (questionType === 'singleChoice') {
            $optionsContainer.html(this.singleSelectOptionsTemplate());
        } else if (questionType === 'NPS') {
            $optionsContainer.html(circleRadioButtonsTemplate);
        } else {
            $optionsContainer.html('');
        }

        questionOptions = questionOptions || [];

        questionOptions.forEach(function (option) {
            self.addNewOption(null, $optionsContainer, option);
        });
    },

    deleteConsumersSurvey: function (e) {
        var $checkbox = this.$el.find('#consumersSurveyTable input[type="checkbox"]:checked').closest('.js_question');

        $checkbox.remove();

        this.showHideButtons({
            add   : true,
            delete: false
        });
    },

    selectStatus: function (opts) {
        var $optionsContainer = opts.$selector.closest('.js_question').find('.js_options');
        var questionType = opts.model._id;

        this.renderOptionsContainer(questionType, $optionsContainer);
    },

    showHideButtons: function (options) {
        var $btnHolder = this.$el.find('#buttonContainer');
        var $btn;
        var inputOptions = options || {};
        var keys = _.keys(inputOptions);
        var cssDisplay;

        keys.forEach(function (key) {
            cssDisplay = inputOptions[key] ? 'inline-block' : 'none';

            $btn = $btnHolder.find('#' + key + 'ConsumersSurvey');
            $btn.css({display: cssDisplay});
        });
    },

    setLocations: function () {
        var self = this;
        var locationsEnArray = [];
        var locationsArArray = [];
        var domainsContentTyes = [CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL];

        domainsContentTyes.forEach(function (contentType) {
            var location = self.filterView.filtersCollections[contentType].getSelected();
            var names = _.pluck(location, 'name');
            var namesEn = _.pluck(names, 'en').join(', ');
            var namesAr = _.pluck(names, 'ar').join(', ');
            var ids = _.pluck(location, '_id');

            self.model.set(contentType, ids.length ? ids : null);

            if (namesEn.length) {
                locationsEnArray.push(namesEn);
            }

            if (namesAr.length) {
                locationsArArray.push(namesAr);
            }
        });

        self.body.location = {
            en: locationsEnArray.length ? locationsEnArray.join(' > ') : '',
            ar: locationsArArray.length ? locationsArArray.join(' > ') : ''
        };
    },

    saveQuestionnary: function (options, cb) {
        var $curEl = this.$el;
        var $consumersSurveyTable = $curEl.find('#consumersSurveyTable');
        var $questionsRows = $consumersSurveyTable.find('.js_question');
        var self = this;
        var newTitle = {
            en: $curEl.find('#questionnaryTitleEn').val() || '',
            ar: $curEl.find('#questionnaryTitleAr').val() || ''
        };
        var title = $curEl.find('#questionnaryTitleEn').val() || $curEl.find('#questionnaryTitleAr').val() ? newTitle : this.model.get('title');
        var dueDate = $curEl.find('#dueDate').val();
        var startDate = $curEl.find('#startDate').val();
        var questionModel = new QuestionModel();
        var model;
        var optionsForModelSave = {
            validate: false,
            wait    : true,
            success : function (xhr) {
                var startDate = xhr.get('startDate');
                if (startDate) {
                    xhr.set('startDate', moment.utc(startDate).format('DD.MM.YYYY'));
                }

                self.trigger('modelSaved', xhr);

                cb();
            },

            error: function (model, xhr, options) {
                App.render({type: 'error', message: xhr.innerText});
            }
        };

        this.body = {};
        this.body.title = title;
        this.body.dueDate = dueDate ? moment.utc(dueDate, 'DD.MM.YYYY').toISOString() : null;
        this.body.startDate = startDate ? moment.utc(startDate, 'DD.MM.YYYY').toISOString() : null;
        this.body.questions = $questionsRows.length;
        this.setLocations();
        /*if (this.edit && this.model) {
            this.body.location = {
                en: 'Location',
                ar: 'Location'
            };
        }*/
        this.model.setFieldsNames(this.translation, this.body);
        this.model.validate(this.body, function (err) {
            if (err && err.length) {

                return App.renderErrors(err);

            }
            self.body.questions = [];

            $questionsRows.each(function (index, el) {
                var $el = $(el);
                var $optionsInputs = $el.find('.options');
                var questionBody = {};

                questionBody.type = $el.find('.js_questionType input').attr('data-id');
                questionBody.title = {
                    en: $el.find('#questionTitleEn').val(),
                    ar: $el.find('#questionTitleAr').val()
                };
                questionBody.options = [];

                $optionsInputs.each(function (index, el) {
                    var object = {};
                    var $el = $(el);
                    object.en = $el.find('#optionEn').val();
                    object.ar = $el.find('#optionAr').val();

                    questionBody.options.push(object);
                });

                questionModel.setFieldsNames(self.translation);
                err = questionModel.validate(questionBody, function (errors) {
                    if (errors && errors.length) {
                        return errors;
                    }
                    self.body.questions.push(questionBody);
                    return null;
                });
            });
            if (err && err.length) {
                return App.renderErrors(err);
            }

            if (self.edit) {
                optionsForModelSave.patch = true;
                model = self.model.toJSON();

                if (!self.valueWasChanged) {
                    delete self.body.questions;
                }

                if (self.body.title === model.title) {
                    delete self.body.title;
                }
                /*if (self.edit && model) {
                    delete self.body.location;
                }*/
            }

            if (!Object.keys(self.body).length && !options.send) {
                return cb();
            }
            self.body.send = options.send;
            self.model.set(self.body);
            self.model.save(null, optionsForModelSave);
        });
    },

    renderModelData: function () {
        var questions = this.questionsCollection.toJSON();
        var self = this;

        questions.forEach(function (question) {
            self.addConsumersSurvey(null, question);
        });
    },

    render: function () {
        var jsonModel = this.model.toJSON();
        var title = this.edit ? this.translation.editBtn : this.translation.duplicateBtn;
        var anotherLanguage = this.currentLanguage === 'en' ? 'Ar' : 'En';

        if (this.create) {
            title = this.translation.create;
        }

        if (jsonModel.startDate && (new Date(jsonModel.startDate)).toString() !== 'Invalid Date') {
            jsonModel.startDate = moment(jsonModel.startDate).format('DD.MM.YYYY');
        }

        var formString = this.template({
            model      : jsonModel,
            title      : title,
            translation: this.translation,
            edit       : this.edit,
            App        : App,
        });

        var self = this;
        var $curEl;
        var questionnarieTableTitle;
        var idToSearch = '#' + this.currentLanguage;
        var idToBind = this.currentLanguage === 'en' ? 'En' : 'Ar';
        var dateStart = jsonModel.startDate && moment(jsonModel.startDate, 'DD.MM.YYYY').toDate();
        var startDate = dateStart && (dateStart < new Date()) ? dateStart : new Date();
        var dateEnd = jsonModel.dueDate && moment(jsonModel.dueDate, 'DD.MM.YYYY').toDate();
        var idToFind;

        this.$el = $(formString).dialog({
            dialogClass: 'edit-dialog full-height-dialog',
            width      : '80%',
            title      : this.translation.createQuestionary,
            buttons    : {
                save: {
                    text : this.translation.saveBtn,
                    class: 'btn',
                    click: function () {
                        var that = this;
                        var send;
                        if (self.edit) {
                            send = jsonModel.status._id === 'active';
                        }

                        self.saveQuestionnary({send: send}, function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                },
                send: {
                    text : this.translation.sendBtn,
                    class: 'btn',
                    click: function () {
                        var that = this;

                        self.saveQuestionnary({send: true}, function () {
                            $(that).dialog('destroy').remove();
                        });
                    }
                }
            }
        });

        $curEl = this.$el;

        if (this.renderModel) {
            this.renderModelData();
        }

        var $startDate = $curEl.find('#startDate');
        var $endDate = $curEl.find('#dueDate');

        $startDate.datepicker({
            changeMonth: true,
            changeYear : true,
            yearRange  : '-20y:c+10y',
            minDate    : new Date(),
            maxDate    : dateEnd,
            onClose    : function (selectedDate) {
                if (selectedDate) {
                    $endDate.datepicker('option', 'minDate', selectedDate);
                }
            }
        });

        $endDate.datepicker({
            changeMonth: true,
            changeYear : true,
            yearRange  : '-20y:c+10y',
            minDate    : dateStart,
            onClose    : function (selectedDate) {
                if (selectedDate) {
                    $startDate.datepicker('option', 'maxDate', selectedDate);
                }
            }
        });

        implementShowHideArabicInputIn(this);

        this.showHideButtons({
            add   : true,
            delete: false
        });

        idToFind = 'questionnaryTitle' + anotherLanguage;
        $curEl.find('#' + idToFind).hide();

        questionnarieTableTitle = $curEl.find(idToSearch);

        $curEl.find('#questionnaryTitle' + idToBind).on('input', function (e) {
            questionnarieTableTitle.text(e.target.value);
        });

        this.delegateEvents(this.events);

        return this;
    }
});

var $ = require('jquery');
var _ = require('underscore');
var d3 = require('d3');
var PreViewTemplate = require('../../../../templates/questionnary/preview.html');
var QuestionListTemplate = require('../../../../templates/questionnary/questionList.html');
var RespondentsListTemplate = require('../../../../templates/questionnary/respondentsList.html');
var RespondentsFullListTemplate = require('../../../../templates/questionnary/respondentsFullList.html');
var QuestionFullAnswerTemplate = require('../../../../templates/questionnary/questionFullAnswer.html');
var QuestionSingleSelectTemplate = require('../../../../templates/questionnary/questionSingleSelect.html');
var QuestionMultiselectTemplate = require('../../../../templates/questionnary/guestionMultiselect.html');
var QuestionnaryAnswerModel = require('../../../models/questionnaryAnswer');
var QuestionnaryAnswersCollection = require('../../../collections/questionnaryAnswers/collection');
var BaseView = require('../../../views/baseDialog');
var CONTENT_TYPES = require('../../../constants/contentType');
var LEVEL_CONFIG = require('../../../constants/levelConfig');
var ACL_ROLES = require('../../../constants/aclRoleIndexes');
var EditAnswerView = require('../../../views/questionnary/editAnswer');
var INFO_MESSAGES = require('../../../constants/infoMessages');
var App = require('../../../appState');

module.exports = BaseView.extend({
    contentType: CONTENT_TYPES.QUESTIONNARIES,

    template                    : _.template(PreViewTemplate),
    questionListTemplate        : _.template(QuestionListTemplate),
    respondentsListTemplate     : _.template(RespondentsListTemplate),
    respondentsFullListTemplate : _.template(RespondentsFullListTemplate),
    questionFullAnswerTemplate  : _.template(QuestionFullAnswerTemplate),
    questionSingleSelectTemplate: _.template(QuestionSingleSelectTemplate),
    questionMultiselectTemplate : _.template(QuestionMultiselectTemplate),

    events: {
        'click #questionList .questionsContainerItem': 'questionClick',
        'click #respondentsFullList .questionsList'  : 'respondentClick',
        'click #duplicate'                           : 'duplicateQuestionnary',
        'click #edit'                                : 'editQuestionnary',
        'keyup #searchInput'                         : 'searchData',
        'keyup #respondentSearchInput'               : 'respondentSearchData',
        'click #goToBtn'                             : 'goTo',
        'click .edit-answer': 'showEditAnswerView',
        'click .delete-answer': 'deleteAnswer',
    },

    initialize: function (options) {
        this.model = options.model;
        this.translation = options.translation;
        this.activityList = options.activityList;
        options.contentType = this.contentType;

        this.makeRender(options);
        this.render();

        this.answersCollection = new QuestionnaryAnswersCollection();
        this.answersCollection.fetch({data: {questionnaryId: this.model.get('_id')}, reset: true, parse: true});
        this.answersCollection.on('reset', function () {
            var $curEl = this.$el;

            this.questionClick({}, $curEl.find('#questionList .questionsContainerItem:first'));
            this.renderFullRespondentsList();
            this.respondentClick({}, $curEl.find('#respondentsFullList .questionsList:first'));
        }, this);
    },

    showEditAnswerView: function (event) {
        var that = this;
        var currentLanguage = App.currentUser.currentLanguage;
        var target = $(event.target);
        var personnelId = target.attr('data-personnel-id');
        var selectedQuestionId = target.attr('data-question-id') || this.answersCollection.questionId;
        var selectedQuestion = this.model.get('questions').find(function (item) {
            return item._id === selectedQuestionId;
        });
        var answerForQuestion = this.answersCollection.findWhere({
            questionId: selectedQuestionId,
            personnelId: personnelId,
        });
        answerForQuestion = answerForQuestion.toJSON();

        this.editAnswerView = new EditAnswerView({
            translation: this.translation,
            questionType: selectedQuestion.type._id,
            questionOptions: selectedQuestion.options,
            questionText: selectedQuestion.title.currentLanguage,
            selectedOptionIndexes: answerForQuestion.optionIndex,
            fullAnswer: answerForQuestion.text,
        });
        this.editAnswerView.on('edit-answer', function (data) {
            var model = new QuestionnaryAnswerModel();

            model.edit(answerForQuestion._id, data);

            model.on('answer-edited', function () {
                that.editAnswerView.$el.dialog('close').dialog('destroy').remove();

                that.trigger('re-render', answerForQuestion.questionnaryId);
                that.trigger('update-list-view');

                that.$el.dialog('close').dialog('destroy').remove();
            });
        });
    },

    deleteAnswer: function (event) {
        if (confirm(INFO_MESSAGES.confirmDeleteAnswer[App.currentUser.currentLanguage])) {
            var that = this;
            var target = $(event.target);
            var answerId = target.attr('data-id');
            var model = new QuestionnaryAnswerModel();
            var answerModel = this.answersCollection.get(answerId);

            model.delete(answerId);

            model.on('answer-deleted', function () {
                that.trigger('re-render', answerModel.get('questionnaryId'));

                that.$el.dialog('close').dialog('destroy').remove();
            });
        }
    },

    duplicateQuestionnary: function () {
        this.trigger('duplicate', {edit: false, model: this.model});

        this.$el.dialog('close').dialog('destroy').remove();
    },

    editQuestionnary: function () {
        this.trigger('edit', {edit: true, model: this.model});

        this.$el.dialog('close').dialog('destroy').remove();
    },

    renderDiagram: function (questionId) {
        var question = _.findWhere(this.model.get('questions'), {_id: questionId});
        var options;
        var optionsCountArray = [];
        var displayText = [];
        var outerRadius = 80;
        var innerRadius = 45;
        var pie = d3.layout.pie();
        var color = d3.scale.category20c();
        var percentArray = [];
        var horizontalLinePoints = [];
        var self = this;
        var svg;
        var arc;
        var arcs;
        var sum = 0;
        var outerArc;
        var $questionsDiagram = this.$el.find('#questionsDiagram');

        $questionsDiagram.html('');

        if (['fullAnswer', 'multiChoice'].indexOf(question.type._id) !== -1) {
            return false;
        }

        options = question.options;
        options.forEach(function (option, index) {
            var answerCount = self.answersCollection.getAnswerCount(questionId, index);
            if (answerCount != 0) {
                optionsCountArray.push(answerCount);
                displayText.push(option.currentLanguage);
                sum += answerCount;
            }
        });

        if (sum === 0) {
            return false;
        }

        optionsCountArray.forEach(function (optionCount) {
            percentArray.push((optionCount * 100 / sum).toFixed(2));
        });

        svg = d3.select($questionsDiagram[0]).append('svg').attr({
            width : '160px',
            height: '160px'
        }).style({
            margin  : '0 auto',
            display : 'block',
            overflow: 'visible'
        });

        outerArc = d3.svg.arc()
            .innerRadius(outerRadius + 30)
            .outerRadius(outerRadius + 30);

        arc = d3.svg.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        arcs = svg.selectAll('g.arc')
            .data(pie(optionsCountArray))
            .enter()
            .append('g')
            .attr({
                class    : 'arc',
                transform: 'translate(' + outerRadius + ',' + outerRadius + ')'
            });

        arcs.append('path')
            .attr({
                fill: function (d, i) {
                    return color(i);
                },
                d   : arc
            });

        rect = arcs.append("rect").attr({
            x: function (d) {
                centroid = arc.centroid(d);
                midAngle = Math.atan2(centroid[1], centroid[0]);
                x = Math.cos(midAngle) * 110;
                sign = (x > 0) ? 1 : -1;
                labelX = x + (5 * sign);
                if(centroid[0] > 0) {
                    return labelX;
                }
                return labelX - 140;
            },
            y: function (d) {
                centroid = arc.centroid(d);
                midAngle = Math.atan2(centroid[1], centroid[0]);
                y = Math.sin(midAngle) * 110 -30;
                return y + 12;
            },
            width    : 16,
            height   : 16,
            fill     : function (d, i) {
                return color(i);
            }
        });

        rectNumber = arcs.append('text').attr({
            x: function (d) {
                centroid = arc.centroid(d);
                midAngle = Math.atan2(centroid[1], centroid[0]);
                x = Math.cos(midAngle) * 110;
                sign = (x > 0) ? 1 : -1;
                labelX = x + (5 * sign);
                if(centroid[0] > 0) {
                    return labelX + 8;
                }
                return labelX - 140 + 8;
            },
            y: function (d) {
                centroid = arc.centroid(d);
                midAngle = Math.atan2(centroid[1], centroid[0]);
                y = Math.sin(midAngle) * 110 -30;
                return y + 22;
            },
            "text-anchor": 'middle',
            "font-size"  : '12px',
            "fill"       : "#fff"
        }).text(function (d, i) {
            return i + 1;
        });

        percent = arcs.append('text').attr({
            x: function (d) {
                centroid = arc.centroid(d);
                midAngle = Math.atan2(centroid[1], centroid[0]);
                x = Math.cos(midAngle) * 110;
                sign = (x > 0) ? 1 : -1;
                labelX = x + (5 * sign);
                if(centroid[0] > 0) {
                    return labelX + 40;
                }
                return labelX - 140 + 40;
            },
            y: function (d) {
                centroid = arc.centroid(d);
                midAngle = Math.atan2(centroid[1], centroid[0]);
                y = Math.sin(midAngle) * 110 -30;
                return y + 22;
            },
            "text-anchor": 'middle',
            "font-size"  : '12px',
            "font-weight": 'bold'
        }).text(function (d, i) {
            return percentArray[i] + '%';
        });

        optionsCount = arcs.append('text').attr({
            x: function (d) {
                centroid = arc.centroid(d);
                midAngle = Math.atan2(centroid[1], centroid[0]);
                x = Math.cos(midAngle) * 110;
                sign = (x > 0) ? 1 : -1;
                labelX = x + (5 * sign);
                if(centroid[0] > 0) {
                    return labelX + 72;
                }
                return labelX - 140 + 72;
            },
            y: function (d) {
                centroid = arc.centroid(d);
                midAngle = Math.atan2(centroid[1], centroid[0]);
                y = Math.sin(midAngle) * 110 -30;
                return y + 22;
            },
            "text-anchor": 'middle',
            "font-size"  : '12px'
        }).text(function (d, i) {
            return ' ( ' + optionsCountArray[i] + ' )';
        });

        textLabels = arcs.append("text").attr({
            x: function (d) {
                centroid = arc.centroid(d);
                midAngle = Math.atan2(centroid[1], centroid[0]);
                x = Math.cos(midAngle) * 110;
                sign = (x > 0) ? 1 : -1;
                labelX = x + (5 * sign);
                if(centroid[0] > 0) {
                    return labelX;
                }
                return labelX - 145;
            },
            y: function (d) {
                centroid = arc.centroid(d);
                midAngle = Math.atan2(centroid[1], centroid[0]);
                y = Math.sin(midAngle) * 110;
                return y + 10;
            },
            'text-anchor': 'start',
            "font-size"  : '12px',
            'font-style' : 'italic'
        }).text(function (d, i) {
            return displayText[i].capitalizer('firstCaps');
        });

        textLines = arcs.append("polyline")
            .style({
                fill          : 'none',
                stroke        : 'black',
                'stroke-width': 1
            }).attr({
            points: function (d, i) {
                var startPoint = arc.centroid(d);
                var endPoint = outerArc.centroid(d);
                var horizontalLinePoint;

                if (endPoint[0] > 0) {
                    horizontalLinePoint = [endPoint[0] + 150, endPoint[1]];
                } else {
                    horizontalLinePoint = [endPoint[0] - 150, endPoint[1]];
                }

                horizontalLinePoints.push(horizontalLinePoint);

                return startPoint.join(', ') + ' ' + endPoint.join(', ') + ' ' + horizontalLinePoint.join(', ');
            },
            'class': "label-line",
            "fill" : "#000",
            "stroke": '#393939'
        });

        alpha = 0.5;
        spacing = 40;

        function push() {
            again = false;
            textLabels.each(function (d) {
                a = this;
                da = d3.select(a);
                y1 = da.attr("y");
                textLabels.each(function (d) {
                    b = this;
                    if (a == b) return;
                    db = d3.select(b);
                    if (da.attr("text-anchor") != db.attr("text-anchor")) return;
                    if (da.attr("x") < 0 && db.attr("x") > 0 || da.attr("x") > 0 && db.attr("x") < 0) return;
                    y2 = db.attr("y");
                    deltaY = y1 - y2;

                    if (Math.abs(deltaY) > spacing) return;

                    again = true;
                    sign = deltaY > 0 ? 1 : -1;
                    adjust = sign * alpha;
                    da.attr("y",+y1 + adjust);
                    db.attr("y",+y2 - adjust);
                });
            });
            if(again) {
                labelElements = textLabels[0];
                textLines.attr("y2",function(d, i) {
                    labelForLine = d3.select(labelElements[i]);
                    return labelForLine.attr("y");
                });
                rect.attr("y", function (d, i) {
                    labelForLine = d3.select(labelElements[i]);
                    return labelForLine.attr("y") - 28;
                });
                rectNumber.attr("y", function (d, i) {
                    labelForLine = d3.select(labelElements[i]);
                    return labelForLine.attr("y") - 16;
                });
                percent.attr("y", function (d, i) {
                    labelForLine = d3.select(labelElements[i]);
                    return labelForLine.attr("y") - 16;
                });
                optionsCount.attr("y", function (d, i) {
                    labelForLine = d3.select(labelElements[i]);
                    return labelForLine.attr("y") - 16;
                });
                setTimeout(push, 10)
            }
        }
        push();
    },

    renderFullRespondentsList: function () {
        var self = this;
        var $curEl = this.$el;
        var answers = self.answersCollection.getAnswerFromPersonnels();
        var $respondentsFullList = $curEl.find('#respondentsFullList');
        var respondentsFullListTemplate = '';

        $respondentsFullList.html('');

        answers.forEach(function (answer) {
            answer.location = self.setLocation(answer);

            self.$el.find('#allRespondentsCount').html(answers.length);
            respondentsFullListTemplate += self.respondentsFullListTemplate({
                answer     : answer,
                translation: self.translation
            });
        });

        $respondentsFullList.append(respondentsFullListTemplate);
    },

    respondentClick: function (e, $questionContainer) {
        var $el = $(e.target);
        var $curEl = this.$el;
        var personnelId;
        var branches;
        var self = this;

        $questionContainer = $questionContainer || $el.closest('.questionsList');
        personnelId = $questionContainer.attr('data-id');
        branches = JSON.parse($questionContainer.attr('data-branch'));

        if (e && e.preventDefault) {
            e.preventDefault();
        }

        $curEl.find('#selectedRespondentsIndex').text($questionContainer.index() + 1);
        $curEl.find('#respondentsFullList .questionsList').removeClass('questionsListActive');
        $questionContainer.addClass('questionsListActive');

        self.answersCollection.personnelId = personnelId;
        self.answersCollection.branches = branches;
        self.renderRespondentsQuestions();
    },

    renderRespondentsQuestions: function () {
        var self = this;
        var currentUserAccessRole = App.currentUser.accessRole.level;
        var $respondentsList = this.$el.find('#questionFullList');
        var branches = self.answersCollection.branches;
        var personnelId = self.answersCollection.personnelId;
        var answers = this.answersCollection.getSelected({modelKey: 'selectedForPersonnel'});
        var respondentQuestionsIds = _.pluck(answers, 'questionId');
        var respondentQuestions = _.filter(this.model.get('questions'), function (question) {
            return respondentQuestionsIds.indexOf(question._id) !== -1;
        });

        $respondentsList.html('');

        respondentQuestions.forEach(function (respondentQuestion) {
            var respondentAnswer = _.find(self.answersCollection.toJSON(), function (answer) {
                return answer.questionId === respondentQuestion._id && _.isEqual(branches, answer.branch) && personnelId === answer.personnelId;
            });
            var respondentAnswerOptionsIndexes = respondentAnswer.optionIndex;
            var respondentAnswerText = respondentAnswer.text;

            respondentQuestion = _.clone(respondentQuestion);

            var templateOptions = {
                question     : respondentQuestion,
                answerIndexes: respondentAnswerOptionsIndexes,
                translation  : self.translation,
                personnelId: personnelId,
                answerId: respondentAnswer._id,
                allowEdit: false,
            };

            var fullAnswerTemplateOptions = {
                question   : respondentQuestion,
                answerText : respondentAnswerText,
                translation: self.translation,
                personnelId: personnelId,
                answerId: respondentAnswer._id,
                allowEdit: false,
            };

            if ([ACL_ROLES.MASTER_ADMIN, ACL_ROLES.COUNTRY_ADMIN, ACL_ROLES.MASTER_UPLOADER, ACL_ROLES.COUNTRY_UPLOADER].includes(currentUserAccessRole)) {
                templateOptions.allowEdit = true;
                fullAnswerTemplateOptions.allowEdit = true;
            }

            if (respondentQuestion.type._id === 'multiChoice') {
                $respondentsList.append(self.questionMultiselectTemplate(templateOptions));
            } else if (respondentQuestion.type._id === 'singleChoice') {
                $respondentsList.append(self.questionSingleSelectTemplate(templateOptions));
            } else if (respondentQuestion.type._id === 'fullAnswer') {
                $respondentsList.append(self.questionFullAnswerTemplate(fullAnswerTemplateOptions));
            }
        });
    },

    searchData: function (e) {
        var $target = $(e.target);
        var text = $target.val();

        this.answersCollection.search({text: text, modelKey: 'selected'});
        this.renderRespondents();
    },

    respondentSearchData: function (e) {
        var $target = $(e.target);
        var text = $target.val();

        this.answersCollection.search({text: text, modelKey: 'selectedForPersonnel'});
        this.renderFullRespondentsList();
    },

    questionClick: function (e, $questionContainer) {
        var $el = $(e.target);
        var $curEl = this.$el;
        var questionId;
        var self = this;
        var questionModel;

        $questionContainer = $questionContainer || $el.closest('.questionsContainerItem');
        questionId = $questionContainer.attr('data-id');
        questionModel = _.findWhere(this.model.get('questions'), {_id: questionId});
        this.renderDiagram(questionId);

        if (e && e.preventDefault) {
            e.preventDefault();
        }

        $curEl.find('#questionBigTitle').text(questionModel.title.currentLanguage);
        $curEl.find('#selectedQuestionIndex').text($questionContainer.index() + 1);
        $curEl.find('#questionList .questionsContainerItem').removeClass('questionsActive');
        $questionContainer.addClass('questionsActive');

        self.answersCollection.questionId = questionId;
        if (['fullAnswer', 'multiChoice'].indexOf(questionModel.type._id) !== -1) {
            $curEl.find('#divToHide').animate({
                height: '-=250'
            }, 'slow');
            $curEl.find('#questionsDiagram').removeClass('diagram_container');
            $curEl.find('.questionsListWrap').removeClass('questionsListWrapHeight').addClass('questionsListWrapHeightIncrease');
        } else {
            $curEl.find('#divToHide').animate({
                height: '+=250'
            }, 'slow');
            $curEl.find('#questionsDiagram').addClass('diagram_container');
            $curEl.find('.questionsListWrap').removeClass('questionsListWrapHeightIncrease').addClass('questionsListWrapHeight');
        }
        self.renderRespondents();
    },

    setLocation: function (answer) {
        var locationsArray = [];
        var currentLanguage = App.currentUser.currentLanguage;
        var domainsContentTypes = [CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.OUTLET, CONTENT_TYPES.BRANCH];

        domainsContentTypes.forEach(function (contentType) {
            var location = answer[contentType];
            var names = _.pluck(_.pluck(location, 'name'), currentLanguage).join(', ');

            if (names.length) {
                locationsArray.push(names);
            }
        });

        return locationsArray.length ? locationsArray.join(' > ') : '';
    },

    renderRespondents: function () {
        var self = this;
        var currentUserAccessRole = App.currentUser.accessRole.level;
        var $respondentsList = this.$el.find('#respondentsList');
        var answers = this.answersCollection.getSelected({modelKey: 'selected'});
        var respondentList = '';
        var questions = this.model.get('questions');
        var question = _.findWhere(questions, {_id: self.answersCollection.questionId});
        var templateOptions = {
            question   : question,
            translation: self.translation,
            allowEdit: false,
        };

        if ([ACL_ROLES.MASTER_ADMIN, ACL_ROLES.COUNTRY_ADMIN, ACL_ROLES.MASTER_UPLOADER, ACL_ROLES.COUNTRY_UPLOADER].includes(currentUserAccessRole)) {
            templateOptions.allowEdit = true;
        }

        $respondentsList.html('');

        answers.forEach(function (answer) {
            answer.location = self.setLocation(answer);

            templateOptions.answer = answer;

            respondentList += self.respondentsListTemplate(templateOptions);
        });

        $respondentsList.append(respondentList);
    },

    render: function () {
        var jsonModel = this.model.toJSON();
        var questionList = '';
        var self = this;
        var $curEl;
        var currentConfig;
        var formString = this.template({
            model       : jsonModel,
            translation : this.translation,
            activityList: this.activityList
        });

        this.$el = $(formString).dialog({
            dialogClass  : 'edit-dialog full-height-dialog',
            width        : '80%',
            title        : this.translation.questionaryPreview,
            showCancelBtn: false,
            buttons      : {
                ok: {
                    text : self.translation.okBtn,
                    class: 'btn',
                    click: function () {
                        $(this).dialog('close').dialog('destroy').remove();
                    }
                }
            }
        });
        $curEl = this.$el;

        jsonModel.questions.forEach(function (question) {
            questionList += self.questionListTemplate({
                question   : question,
                translation: self.translation
            });
        });

        $curEl.find('#questionList').append(questionList);

        if (this.activityList && App.currentUser.workAccess) {
            currentConfig = LEVEL_CONFIG[this.contentType].activityList.preview[0];

            var template = require('../../../../' + currentConfig.template);
            var container = self.$el.find(currentConfig.selector);

            template = _.template(template);

            if (!container.find('#' + currentConfig.elementId).length) {
                container[currentConfig.insertType](template({
                    elementId  : currentConfig.elementId,
                    translation: self.translation
                }));
            }
        }

        this.delegateEvents(this.events);

        return this;
    }
});

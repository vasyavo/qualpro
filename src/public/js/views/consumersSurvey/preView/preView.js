define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/consumersSurvey/preview.html',
    'text!templates/consumersSurvey/questionList.html',
    'text!templates/consumersSurvey/respondentsList.html',
    'text!templates/consumersSurvey/respondentsFullList.html',
    'text!templates/consumersSurvey/questionFullAnswer.html',
    'text!templates/consumersSurvey/questionSingleSelect.html',
    'text!templates/consumersSurvey/questionMultiselect.html',
    'models/consumersSurvey',
    'models/question',
    'collections/consumersSurvey/questionCollection',
    'collections/consumersSurveyAnswers/collection',
    'constants/otherConstants',
    'views/baseDialog',
    'constants/contentType',
    'd3',
    'constants/levelConfig'
], function (Backbone, _, $, PreViewTemplate, QuestionListTemplate, RespondentsListTemplate, RespondentsFullListTemplate,
             QuestionFullAnswerTemplate, QuestionSingleSelectTemplate, QuestionMultiselectTemplate,
             Model, QuestionModel, QuestionCollection, QuestionnaryAnswersCollection, OTHER_CONSTANTS,
             BaseView, CONTENT_TYPES, d3, LEVEL_CONFIG) {
    var preView = BaseView.extend({
        contentType: CONTENT_TYPES.CONSUMER_SURVEY,

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
            'click #goToBtn'                             : 'goTo'
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

            this.$el.find('#questionsDiagram').html('');

            if (['fullAnswer', 'multiChoice'].indexOf(question.type._id) !== -1) {
                return false;
            }

            options = question.options;
            options.forEach(function (option, index) {
                var answerCount = self.answersCollection.getAnswerCount(questionId, index);

                optionsCountArray.push(answerCount);
                sum += answerCount;
            });

            if (sum === 0) {
                return false;
            }

            optionsCountArray.forEach(function (optionCount) {
                percentArray.push((optionCount * 100 / sum).toFixed(2));
            });

            svg = d3.select('div#questionsDiagram').append('svg').attr({
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

            arcs.append('polyline')
                .style({
                    fill          : 'none',
                    stroke        : 'black',
                    'stroke-width': 1
                })
                .attr({
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
                    }
                });

            arcs.append('rect')
                .attr({
                    transform: function (d, i) {
                        var translate = horizontalLinePoints[i];

                        if (translate[0] > 0) {
                            translate[0] -= 140;
                        }

                        translate[1] -= 20;

                        return 'translate(' + translate + ')';
                    },
                    width    : 16,
                    height   : 16,
                    fill     : function (d, i) {
                        return color(i);
                    }
                });

            arcs
                .append('text')
                .attr({
                    transform    : function (d, i) {
                        var translate = horizontalLinePoints[i];

                        translate[0] += 8;
                        translate[1] += 12;

                        return 'translate(' + translate + ')';
                    },
                    "text-anchor": 'middle',
                    "font-size"  : '12px',
                    "fill"       : "#fff"
                }).text(function (d, i) {
                return i + 1;
            });

            arcs
                .append('text')
                .attr({
                    transform    : function (d, i) {
                        var translate = horizontalLinePoints[i];

                        if (translate[0] > 0) {
                            translate[0] += 32;
                        } else {
                            translate[0] += 30;
                        }

                        return 'translate(' + translate + ')';
                    },
                    "text-anchor": 'middle',
                    "font-size"  : '12px',
                    "font-weight": 'bold'
                }).text(function (d, i) {
                return percentArray[i] + '%';
            });

            arcs
                .append('text')
                .attr({
                    transform    : function (d, i) {
                        var translate = horizontalLinePoints[i];

                        if (translate[0] > 0) {
                            translate[0] += 35;
                        } else {
                            translate[0] += 35;
                        }

                        return 'translate(' + translate + ')';
                    },
                    "text-anchor": 'middle',
                    "font-size"  : '12px'
                }).text(function (d, i) {
                return ' ( ' + optionsCountArray[i] + ' )';
            });

            arcs
                .append('text')
                .attr({
                    transform    : function (d, i) {
                        var translate = horizontalLinePoints[i];

                        translate[0] -= 50;
                        translate[1] += 20;

                        return 'translate(' + translate + ')';
                    },
                    "text-anchor": 'middle',
                    "font-size"  : '12px',
                    'font-style' : 'italic'
                }).text(function (d, i) {
                return options[i].currentLanguage.capitalizer('firstCaps');
            });
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
            var self = this;

            $questionContainer = $questionContainer || $el.closest('.questionsList');
            personnelId = $questionContainer.attr('data-id');

            if (e && e.preventDefault) {
                e.preventDefault();
            }

            $curEl.find('#selectedRespondentsIndex').text($questionContainer.index() + 1);
            $curEl.find('#respondentsFullList .questionsList').removeClass('questionsListActive');
            $questionContainer.addClass('questionsListActive');

            self.answersCollection.personnelId = personnelId;
            self.renderRespondentsQuestions();
        },

        renderRespondentsQuestions: function () {
            var self = this;
            var $respondentsList = this.$el.find('#questionFullList');
            var personnelId = self.answersCollection.personnelId;
            var answers = this.answersCollection.getSelected({modelKey: 'selectedForPersonnel'});
            var respondentQuestionsIds = _.pluck(answers, 'questionId');
            var respondentQuestions = _.filter(this.model.get('questions'), function (question) {
                return respondentQuestionsIds.indexOf(question._id) !== -1;
            });

            $respondentsList.html('');

            respondentQuestions.forEach(function (respondentQuestion) {
                var respondentAnswer = _.findWhere(self.answersCollection.toJSON(), {
                    questionId : respondentQuestion._id,
                    personnelId: personnelId
                });
                var respondentAnswerOptionsIndexes = respondentAnswer.optionIndex;
                var respondentAnswerText = respondentAnswer.text;

                respondentQuestion = _.clone(respondentQuestion);

                if (respondentQuestion.type._id === 'multiChoice') {
                    $respondentsList.append(self.questionMultiselectTemplate({
                        question     : respondentQuestion,
                        answerIndexes: respondentAnswerOptionsIndexes,
                        translation  : self.translation
                    }));
                } else if (respondentQuestion.type._id === 'singleChoice') {
                    $respondentsList.append(self.questionSingleSelectTemplate({
                        question     : respondentQuestion,
                        answerIndexes: respondentAnswerOptionsIndexes,
                        translation  : self.translation
                    }));
                } else if (respondentQuestion.type._id === 'fullAnswer') {
                    $respondentsList.append(self.questionFullAnswerTemplate({
                        question   : respondentQuestion,
                        answerText : respondentAnswerText,
                        translation: self.translation
                    }));
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
            var $respondentsList = this.$el.find('#respondentsList');
            var answers = this.answersCollection.getSelected({modelKey: 'selected'});
            var respondentList = '';
            var questions = this.model.get('questions');
            var question = _.findWhere(questions, {_id: self.answersCollection.questionId});

            $respondentsList.html('');

            answers.forEach(function (answer) {
                answer.location = self.setLocation(answer);

                respondentList += self.respondentsListTemplate({
                    answer     : answer,
                    question   : question,
                    translation: self.translation
                });
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

                require([
                        currentConfig.template
                    ],
                    function (template) {
                        var container = self.$el.find(currentConfig.selector);

                        template = _.template(template);

                        if (!container.find('#' + currentConfig.elementId).length) {
                            container[currentConfig.insertType](template({
                                elementId  : currentConfig.elementId,
                                translation: self.translation
                            }));
                        }
                    });
            }

            this.delegateEvents(this.events);

            return this;
        }
    });

    return preView;
});

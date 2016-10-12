define([
        'Backbone',
        'jQuery',
        'text!templates/personnel/form/biYearlyEvaluationFormTemplate.html',
        'helpers/createBiYearlyWorkflow',
        'models/biYearlyRating',
        'views/baseDialog'
    ],
    function (Backbone, $, template, createBiYearlyWorkflow, BiYearlyRatingModel, BaseDialog) {
        var View = BaseDialog.extend({

            //region Initialize

            template  : _.template(template),
            completed : false,
            events    : {
                'click .workflowItem': 'workflowItemClicked'
            },
            initialize: function (options) {

                this.translation = options.translation;
                this.model = new BiYearlyRatingModel({translation: this.translation});
                this.ratings = this.model.get('details');
                this.workflow = createBiYearlyWorkflow(this.ratings, this.translation);
                this.makeRender();
                this.render();
            },

            //endregion

            //region Handlers

            workflowItemClicked: function (e) {

                var $target = $(e.currentTarget);

                if (!$target.hasClass('enabled')) {
                    return;
                }

                this.goToWorkflow(this.workflow[$target.attr('id')]);
            },

            ratingViewStateChanged: function (e) {
                this.setNextButtonDisabledAccordingToRatingViews(e.target.group);
            },

            submitEvaluationFormClicked: function () {
                this.model.set('rating', this.ratings.overallPerformance.result.value);
                this.trigger('formSubmit', {target: this});
            },

            nextButtonClicked: function () {
                this.goToWorkflow(this.currentWorkflow.next);
            },

            previousButtonClicked: function () {
                this.goToWorkflow(this.currentWorkflow.prev);
            },

            //endregion

            //region Methods

            initializeWorkflowItem: function (workflowItem) {
                var self = this;
                var template = workflowItem.template({
                    preview    : false,
                    translation: this.translation
                });

                this.$workflowContent.html(template);

                workflowItem.safeInitialize();
                workflowItem.views.forEach(function (view) {
                    view.on('stateChanged', self.ratingViewStateChanged, self);
                    view.render();
                });

                if (workflowItem.views) {
                    this.setNextButtonDisabledAccordingToRatingViews(workflowItem.views)
                }

                this.renderRatings();
            },

            setNextButtonDisabledAccordingToRatingViews: function (ratingViews) {
                var $nextActionButtons = this.$nextActionButtons || (this.$nextActionButtons = $('.nextActionButton'));
                var canGoNext = true;

                for (var i = ratingViews.length; i--;) {
                    if (!ratingViews[i].completed) {
                        canGoNext = false;
                    }
                }

                $nextActionButtons.prop('disabled', !canGoNext).toggleClass('ui-state-disabled', !canGoNext);
            },

            goToWorkflow: function (workflow) {
                var $submitButton = this.$submitButton || (this.$submitButton = $('.submitButton'));
                var $prevButton = this.$prevButton || (this.$prevButton = $('.prevButton'));
                var $nextButton = this.$nextButton || (this.$nextButton = $('.goToNextWorkflowButton'));

                this['$' + this.currentWorkflow.id].removeClass('active');

                this.currentWorkflow = workflow;
                this.initializeWorkflowItem(this.currentWorkflow);

                $submitButton.toggle(!this.currentWorkflow.next);
                $nextButton.toggle(!!this.currentWorkflow.next);
                $prevButton.toggle(!!this.currentWorkflow.prev);

                this.setNextButtonDisabledAccordingToRatingViews(this.currentWorkflow.views);

                this['$' + this.currentWorkflow.id].addClass('active enabled');
            },

            //endregion

            //region Render

            renderRatings: function () {
                var $el = this.$el;

                $el.find('.rating').barrating();
            },

            render: function (options) {
                var $el;
                var self = this;

                this.$el = $(this.template({
                    translation: this.translation,
                    showEditBtn: false
                })).dialog({
                    dialogClass: 'formDialog yearly-evaluation-form',
                    title      : this.translation.evaluateEmployee,
                    buttons    : {
                        submit: {
                            text : this.translation.submitBtn,
                            class: 'submitButton nextActionButton',
                            style: 'display:none',
                            click: this.submitEvaluationFormClicked.bind(this)
                        },

                        next  : {
                            disabled: true,
                            class   : 'goToNextWorkflowButton nextActionButton',
                            text    : this.translation.nextBtn,
                            click   : this.nextButtonClicked.bind(this)
                        },
                        back  : {
                            class: 'prevButton',
                            text : this.translation.backBtn,
                            style: 'display:none',
                            click: this.previousButtonClicked.bind(this)
                        },
                        cancel: {
                            text: this.translation.cancelBtn
                        }
                    }
                });

                this.on('biYearlyEvaluationSaved', function () {
                    $(".cancelBtn").trigger('click');
                });

                $el = this.$el;
                this.$workflowContent = $el.find('.workflowContent');
                this.currentWorkflow = this.workflow.professionalSkills;
                this.$professionalSkills = $el.find('#professionalSkills');
                this.$personalSkills = $el.find('#personalSkills');
                this.$summary = $el.find('#summary');
                this.initializeWorkflowItem(this.currentWorkflow);
                this.delegateEvents(this.events);
            }

            //endregion
        });

        return View;
    })
;
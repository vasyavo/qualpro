define([
        'Backbone',
        'jQuery',
        'text!templates/personnel/form/biYearlyEvaluationFormTemplate.html',
        'helpers/createBiYearlyWorkflow',
        'models/biYearlyRating',
        'views/personnel/forms/biYearlyEvaluationEdit',
        'views/baseDialog',
        'async'
    ],
    function (Backbone, $, template, createBiYearlyWorkflow, BiYearlyRatingModel, BiYearlyEvaluationEditView, BaseDialog, async) {
        var View = BaseDialog.extend({

            template  : _.template(template),
            completed : false,
            events    : {
                'click .workflowItem': 'workflowItemClicked',
                'click #editBtn'     : 'onEditBtn'
            },
            initialize: function (options) {
                options = options || {};

                this.originalModel = options.originalModel;
                this.translation = options.translation;
                this.personnel = options.personnel;
                this.model = new BiYearlyRatingModel({translation: this.translation});
                this.model.setRatingsToModel(this.originalModel);
                this.ratings = this.model.get('details');
                this.workflow = createBiYearlyWorkflow(this.ratings, this.translation, true);

                this.makeRender();
                this.render();
            },

            onEditBtn: function () {
                var self = this;

                this.editView = new BiYearlyEvaluationEditView({model: this.model, translation: this.translation});
                this.editView.on('formSubmit', function (data) {
                    self.trigger('formSubmit', {target: data.target})
                });
                this.editView.on('editDialogCanceled', function () {
                    self.goToWorkflow(self.currentWorkflow);
                });
                this.on('biYearlyEvaluationSaved', function () {
                    self.editView.trigger('closeBiYearlyEditView');

                    if (self.model.changedAttributes()) {
                        self.collection.add(self.model, {merge: true, silent: true});
                        self.goToWorkflow(self.currentWorkflow);
                    }

                });
            },

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

            nextButtonClicked: function () {
                this.goToWorkflow(this.currentWorkflow.next);
            },

            previousButtonClicked: function () {
                this.goToWorkflow(this.currentWorkflow.prev);
            },

            initializeWorkflowItem: function (workflowItem) {
                var self = this;
                var template = workflowItem.template({
                    preview    : true,
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

            renderRatings: function () {
                var $el = this.$el;

                $el.find('.rating').barrating({readonly: true});
            },

            render: function () {
                var $el;
                //var self = this;

                var accessLevel = App.currentUser.accessRole.level;
                var personnelAccessLevel = this.personnel.accessRole.level;
                var showEditBtn = accessLevel > 0 && accessLevel < 3 && accessLevel < personnelAccessLevel;

                this.$el = $(this.template({
                    translation: this.translation,
                    showEditBtn: showEditBtn
                })).dialog({
                    dialogClass  : 'formDialog yearly-evaluation-form',
                    title        : this.translation.biYearlyEvaluationPreview,
                    showCancelBtn: false,
                    buttons      : {
                        next: {
                            disabled: true,
                            class   : 'goToNextWorkflowButton nextActionButton',
                            text    : this.translation.nextBtn,
                            click   : this.nextButtonClicked.bind(this)
                        },
                        back: {
                            class: 'prevButton',
                            text : this.translation.backBtn,
                            style: 'display:none',
                            click: this.previousButtonClicked.bind(this)
                        },
                        ok  : {
                            text : this.translation.okBtn,
                            click: function () {
                                $(this).dialog('close').dialog('destroy').remove();
                            }
                        }
                    }
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

        });

        return View;
    });

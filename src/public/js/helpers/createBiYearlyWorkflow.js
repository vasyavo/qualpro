var _ = require('Underscore');
var professionalSkillsTemplate = require('../../templates/personnel/form/professionalSkillsTemplate.html');
var personalSkillsTemplate = require('../../templates/personnel/form/personalSkillsTemplate.html');
var summaryTemplate = require('../../templates/personnel/form/summaryTemplate.html');
var TableRatingView = require('../views/personnel/forms/tableRatingView');
var TextRatingView = require('../views/personnel/forms/textRatingView');
var SingleSelectRatingView = require('../views/personnel/forms/singleSelectRatingView');

var createBiYearlyWorkflow = function (ratings, translation, preview) {
    var clearViews = function (views) {
        views.forEach(function (view) {
            view.remove();
        });
        views.length = 0;
    };

    preview = preview || false;

    var workflow = {
        professionalSkills: {
            id            : 'professionalSkills',
            template      : _.template(professionalSkillsTemplate),
            safeInitialize: function () {
                var views = this.views;

                clearViews(views);

                (this.planningAndOrganizationSkillsView = new TableRatingView({
                    el    : preview ? '#planningAndOrganizationSkillsContainerPreview' : '#planningAndOrganizationSkillsContainer',
                    rating: ratings.planningAndOrganizationSkills,
                    translation: translation,
                    preview: preview
                })).group = views;

                (this.sellingSkillsView = new TableRatingView({
                    el    : preview ? '#sellingSkillsContainerPreview' : '#sellingSkillsContainer',
                    rating: ratings.sellingSkills,
                    translation: translation,
                    preview: preview
                })).group = views;

                (this.reportingView = new TableRatingView({
                    el    : preview ? '#reportingContainerPreview' : '#reportingContainer',
                    rating: ratings.reporting,
                    translation: translation,
                    preview: preview
                })).group = views;

                views.push(this.planningAndOrganizationSkillsView,
                    this.sellingSkillsView,
                    this.reportingView);
            },

            views: []
        },

        personalSkills: {
            id            : 'personalSkills',
            template      : _.template(personalSkillsTemplate),
            safeInitialize: function () {
                var views = this.views;

                clearViews(views);

                (this.personalSkillsView = new TableRatingView({
                    el    : preview ? '#personalSkillsContainerPreview' : '#personalSkillsContainer',
                    rating: ratings.personalSkills,
                    translation: translation,
                    preview: preview
                })).group = views;

                views.push(this.personalSkillsView);
            },

            views: []
        },

        summary: {
            id            : 'summary',
            template      : _.template(summaryTemplate).bind(null, {ratings: ratings, preview: preview}),
            safeInitialize: function () {
                var views = this.views;
                var self = this;

                clearViews(views);

                (this.performanceSummaryView = new TextRatingView({
                    el    : preview ? '#performanceContainerPreview' : '#performanceContainer',
                    rating: ratings.performanceSummary,
                    preview: preview
                })).group = views;

                (this.overallPerformanceView = new SingleSelectRatingView({
                    el    : preview ? '#overallPerformanceRatingContainerPreview' : '#overallPerformanceRatingContainer',
                    rating: ratings.overallPerformance,
                    preview: preview
                })).group = views;

                (this.actionView = new TextRatingView({
                    el    : preview ? '#actionContainerPreview' : '#actionContainer',
                    rating: ratings.action,
                    preview: preview
                })).group = views;

                (this.objectives = new TextRatingView({
                    el    : preview ? '#objectivesContainerPreview' : '#objectivesContainer',
                    rating: ratings.objectives,
                    preview: preview
                })).group = views;

                this.performanceSummaryView.on('textAreaChanged', function(data){
                    var text = data && data.text || '';

                    self.performanceSummaryView.rating['result'] = _.escape(text);
                });

                this.actionView.on('textAreaChanged', function(data){
                    var text = data && data.text || '';

                    self.actionView.rating['result'] = _.escape(text);
                });

                this.objectives.on('textAreaChanged', function(data){
                    var text = data && data.text || '';

                    self.objectives.rating['result'] = _.escape(text);
                });

                views.push(this.actionView, this.objectives, this.performanceSummaryView, this.overallPerformanceView);
            },

            views: []
        },

        linkPrevAndNext: function () {
            var previous;
            var current;

            for (var key in this) {
                current = this[key];

                if (previous && typeof current !== 'function') {
                    current.prev = previous;
                    previous.next = current;
                }

                previous = current;
            }

            return this;
        },
    };
    Object.defineProperty(workflow, "linkPrevAndNext", {enumerable: false});
    workflow.linkPrevAndNext();

    return workflow;
};

module.exports = createBiYearlyWorkflow;

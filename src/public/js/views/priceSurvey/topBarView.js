var _ = require('underscore');
var topBarTemplate = require('../../../templates/newProductLaunch/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');
var contentType = require('../../constants/contentType');

module.exports = baseTopBar.extend({
    contentType       : contentType.PRICESURVEY,
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination),

    render: function () {
        var paginationContainer;
        var $thisEl = this.$el;
        var $createBtn;
        var $archiveBtn;
        var $unArchiveBtn;

        $('title').text(this.contentType);

        $thisEl.html(this.template({
            viewType     : this.viewType,
            contentType  : this.contentType,
            translation  : this.translation,
            currentUserId: this.sendPassForCurrentUser
        }));

        $thisEl.find('#' + this.tabName).addClass('viewBarTabActive');

        this.$actionButton = $thisEl.find('.actionBtn');
        this.$editButton = $thisEl.find('#editBtn');

        paginationContainer = $thisEl.find('#paginationHolder');
        paginationContainer.html(this.paginationTemplate({translation: this.translation}));

        $createBtn = $thisEl.find('#createBtn');
        $archiveBtn = $thisEl.find('#archiveBtn');
        $unArchiveBtn = $thisEl.find('#unArchiveBtn');

        if (this.tabName === 'archived') {
            $archiveBtn.hide();
            $unArchiveBtn.show();
            $createBtn.hide();
        } else {
            $createBtn.show();
            $archiveBtn.show();
            $unArchiveBtn.hide();
        }

        return this;
    }
});

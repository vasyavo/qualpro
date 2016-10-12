'use strict';

define([
    'Backbone',
    'jQuery',
    'Underscore',
    'helpers/contentTypesHelper',
    'text!templates/breadcrumbs/breadcrumb.html',
    'js-cookie',
    'constants/contentType'
], function (Backbone, $, _, contentTypes, breadcrumbsTemplate, Cookies, CONTENT_TYPES) {

    var types = [
        CONTENT_TYPES.COUNTRY,
        CONTENT_TYPES.REGION,
        CONTENT_TYPES.SUBREGION,
        CONTENT_TYPES.RETAILSEGMENT,
        CONTENT_TYPES.OUTLET,
        CONTENT_TYPES.BRANCH
    ];

    var View = Backbone.View.extend({
        el       : '#breadcrumbsContainer',
        template : _.template(breadcrumbsTemplate),
        nextIndex: 0,
        events   : {
            'click .breadcrumb': 'navigate'
        },

        initialize: function (options) {
            this.currentBreadcrumb = options.breadcrumb;
            this.contentType = options.contentType;
        },

        add: function (title, id, type, archived) {
            var currentEl = this.$el;
            var self = this;

            currentEl.append(self.template({
                breadcrumb: {
                    title   : title,
                    id      : id,
                    type    : type,
                    index   : self.nextIndex,
                    archived: archived
                }
            }));

            self.nextIndex++;
        },

        navigate: function (e) {
            var contentType;
            var index;
            var data;
            var $target;
            var $last;
            var parentName;
            var parentId;
            var parentArchived;
            var element = this.$el;

            e.preventDefault();

            $target = $(e.target);
            data = $target.data();
            contentType = data.type;
            index = data.index;
            parentArchived = data.archived;

            element.find('.breadcrumb').filter(function () {
                return $(this).data().index > index;
            }).remove();

            $last = element.find('.breadcrumb').last();

            this.nextIndex = index;

            if ($last.length) {
                parentId = $last.data().id;
                parentName = $last.text();
                $last.remove();
            }

            this.trigger('loadParentContent', {
                type          : contentTypes.getNextType(contentType),
                parentId      : parentId,
                parentName    : parentName,
                parentArchived: parentArchived
            });
        },

        render: function () {
            var currentEl = this.$el;
            var self = this;

            if (this.contentType === 'country') {
                self.trigger('initialized', {});
                return this;
            }

            $.get('/breadcrumbs', {breadcrumb: this.currentBreadcrumb}, function (result) {
                var breadcrumbs = result;
                var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
                var anotherLanguage = (currentLanguage === 'en') ? 'ar' : 'en';
                var html = '';
                var i = 0;

                contentTypes.forEachType(function (type, index) {
                    var breadcrumb = breadcrumbs[type];

                    if (breadcrumb) {
                        breadcrumb.type = type;
                        breadcrumb.title = breadcrumb.name[currentLanguage] || breadcrumb.name[anotherLanguage];
                        breadcrumb.index = (i = index);
                        html += self.template({breadcrumb: breadcrumb});
                    }
                });

                currentEl.append(html);
                self.trigger('initialized', breadcrumbs);
                self.nextIndex = i++;
            });

            return this;
        }

    });

    contentTypes.setContentTypes(types);

    return View;
});
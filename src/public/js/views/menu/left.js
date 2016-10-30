'use strict';

define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/menu/left.html',
    'js-cookie'
], function (Backbone, $, _, template, Cookies) {

    var LeftMenuView = Backbone.View.extend({
        el      : '#leftMenuHolder',
        template: _.template(template),

        events: {
            'click li': 'selectMenu'
        },

        initialize: function (options) {
            var collectionJSON = options.collection.toJSON();
            this.collection = options.collection;
            this.currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';

            this.$title = $('#mainTitle');

            App.modules = _.flatten(_.values(collectionJSON));
            this.render();
        },

        selectMenu: function (e, href) {
            var array;
            if (href) {
                array = href.split('/');
                if (array[1] === 'country') {
                    href = '#qualPro/domain/country';
                }
            }
            var $target = e ? $(e.target) : this.$el.find('a[href="' + href + '"]');
            var $li = $target.closest('li');
            var $liText = $li.find('a').first().text();
            var $uls;
            var $oldLi;

            if ($li.hasClass('parentLeft')) {
                $uls = $li.find('ul');

                $oldLi = $li.siblings('.parentLeft').removeClass('selected');
                $li.addClass('selected');

                this.$title.html($liText);

                if ($uls.length) {
                    if (e) {
                        e.stopPropagation();
                        e.preventDefault();
                    }

                    $li.siblings('.menuDropDown').removeClass('menuDropDown');
                    $li.toggleClass('menuDropDown');
                } else {
                    $oldLi
                        .removeClass('menuDropDown');
                }
            } else {
                $li.closest('#leftMenuHolder')
                    .find('li')
                    .not('.parentLeft')
                    .not($li)
                    .removeClass('selectedSub');
                $li.addClass('selectedSub');

                this.$title.html($liText);
            }
        },

        getNameFromUrl: function () {
            var url = document.URL;
            var array = url.split('/');
            var name = '#qualPro/';
            if (!array || !array[4]) {
                return '#qualPro/activityList';
            }
            name += array[4] === 'domain' ? array[4] + '/' + array[5] : array[4];
            return name;
        },

        render: function () {
            var self = this;
            var rootModules = this.collection.get('null');
            var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ||
                Cookies.get('currentLanguage') || 'en';
            var anotherLanguage = (currentLanguage === 'en') ? 'ar' : 'en';

            function getChild(childId) {
                var child = self.collection.get(childId);
                return child;
            }

            this.$el.html(this.template({
                anotherLanguage: anotherLanguage,
                currentLanguage: currentLanguage,
                rootModules    : rootModules,
                getChild       : getChild
            }));

            this.$el.find('.scrollable').mCustomScrollbar();

            this.selectMenu(null, this.getNameFromUrl());

            return this;
        }
    });

    return LeftMenuView;
});

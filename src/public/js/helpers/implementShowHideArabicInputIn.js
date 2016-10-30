define([
    'jQuery'
], function ($) {
    var implementShowHideArabicInputIn = function (view) {
        var $curEl = view.$el;
        $curEl.find('.showHideAr, .showHideTranslation').on('click', function (e) {
            e.preventDefault();

            var id = '#' + $(e.target).data().id;
            var arabicInput = view.$el.find(id);

            arabicInput.toggle();
        });
    };

    return implementShowHideArabicInputIn;
});

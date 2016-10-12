define([], function () {
    var TableRating = function (title, groups) {
        this.title = title;
        this.groups = groups;
        this.type = 'table';
        this.createElementsArrayFromGroups();
    };

    TableRating.prototype.createElementsArrayFromGroups = function () {
        var elements = [];
        var groups = this.groups;

        for (var i = this.groups.length - 1; i >= 0; i--) {
            elements = elements.concat(groups[i]);
        }

        this.elements = elements;
    };
    return TableRating;
});

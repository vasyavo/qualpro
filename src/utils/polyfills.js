const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

Object.defineProperty(Array.prototype, 'fromObjectID', {
    value: function() {
        const array = [];

        for (let i = 0; i < this.length; i++) {
            if (this[i] && typeof this[i] === 'object' && this[i].hasOwnProperty('id')) {
                array.push(this[i].toString());
            } else {
                array.push(null);
            }
        }

        return array;
    },
    enumerable: false
});

Object.defineProperty(Array.prototype, 'objectID', {
    value: function() {
        const array = [];

        for (let i = 0; i < this.length; i++) {
            if (this[i] && typeof this[i] === 'object' && this[i].hasOwnProperty('_id')) {
                array.push(this[i]._id);
            } else {
                if (typeof this[i] === 'string' && this[i].length === 24) {
                    array.push(ObjectId(this[i]));
                }
                if (this[i] === null || this[i] === 'null') {
                    array.push(null);
                }

            }
        }

        return array;
    },
    enumerable: false
});


Object.defineProperty(Array.prototype, 'contains', {
    value: function(predicate) {
        if (typeof predicate !== 'function') {
            return this.indexOf(predicate) !== -1;
        }

        return !!this.find(predicate);
    },
    enumerable: false
});

Object.defineProperty(Array.prototype, 'add', {
    value: function(data) {
        const self = this;

        if (data instanceof Array) {
            data.forEach(function (val) {
                self.push(val);
            });
        } else {
            self.push(data);
        }
    },
    enumerable: false
});

Object.defineProperty(Object.prototype, 'getNestedProperty', {
    value: function(propertyName) {
        var result = this;
        var arr = propertyName.split('.');

        while (arr.length && result) {
            result = result[arr.shift()];
        }

        return result;
    },
    enumerable: false
});

Object.defineProperty(Object.prototype, 'setNestedProperty', {
    value: function(propertyName, propertyValue) {
        var result = this;
        var arr = propertyName.split('.');
        var arrEl;

        while (arr.length && result) {
            arrEl = arr.shift();
            if (arr.length) {
                if (!result[arrEl]) {
                    result[arrEl] = {};
                }
                result = result[arrEl];
            } else {
                result[arrEl] = propertyValue;
            }
        }

        return this;
    },
    enumerable: false
});

Object.defineProperty(Date.prototype, 'addDays', {
    value: function(days) {
        this.setDate(this.getDate() + parseInt(days));
        return this;
    },
    enumerable: false
});

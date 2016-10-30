var parseStringToArray = function (string) {
    var elem;
    var split;
    var curSplitter = string.indexOf('|') === -1 ? ',' : '|';

    if (!string) {
        return [];
    }
    split = string.split(curSplitter);

    for (var i = split.length - 1; i >= 0; i--) {
        elem = split[i];
        split[i] = typeof elem === 'string' ? elem.trim() : elem;
    }

    return split;
};

var map = {
    'Locations': {
        modelName: 'domain',
        fields   : {
            'ID'       : 'ID',
            'Name (EN)': 'name.en',
            'Name (AR)': 'name.ar',
            'Currency' : 'currency',
            'Type'     : 'type',
            'Parent'   : 'parent'
        },

        parsers: {
            type: function (string) {
                return string === 'sub-region' ? 'subRegion' : string;
            }
        },

        ref: [{name: 'parent', model: 'domain'}]

    },

    'Retail Segment': {
        modelName: 'retailSegment',
        fields   : {
            'ID'       : 'ID',
            'Name (EN)': 'name.en',
            'Name (AR)': 'name.ar'
        }
    },

    'Outlet': {
        modelName: 'outlet',
        fields   : {
            'ID'       : 'ID',
            'Name (EN)': 'name.en',
            'Name (AR)': 'name.ar'
        }
    },

    'Branch': {
        modelName: 'branch',
        fields   : {
            'ID'            : 'ID',
            'Name (EN)'     : 'name.en',
            'Name (AR)'     : 'name.ar',
            'Address (EN)'  : 'address.en',
            'Address (AR)'  : 'address.ar',
            'Sub-Region'    : 'subRegion',
            'Retail Segment': 'retailSegment',
            'Outlet'        : 'outlet'
        },
        ref      : [
            {name: 'subRegion', model: 'domain', type: 'subRegion', idAttribute: 'name.en'},
            {name: 'retailSegment', model: 'retailSegment', idAttribute: 'name.en'},
            {name: 'outlet', model: 'outlet', idAttribute: 'name.en'}
        ]
    },

    'Origin': {
        modelName: 'origin',
        fields   : {
            'ID'       : 'ID',
            //'Name': 'name'
            'Name (EN)': 'name.en',
            'Name (AR)': 'name.ar'
        }
    },

    'Position': {
        modelName: 'position',
        fields   : {
            'ID'     : 'ID',
            'name.en': 'name.en',
            'name.ar': 'name.ar'
        }
    },

    'Role': {
        modelName: 'accessRole',
        fields   : {
            'ID'     : 'ID',
            'name.en': 'name.en',
            'name.ar': 'name.ar'
        }
    },

    'Personnel': {
        modelName: 'personnel',
        fields   : {
            'ID'             : 'ID',
            'firstName.en'   : 'firstName.en',
            'firstName.ar'   : 'firstName.ar',
            'lastName.en'    : 'lastName.en',
            'lastName.ar'    : 'lastName.ar',
            'Country'        : 'country',
            'Region'         : 'region',
            'Sub-Region'     : 'subRegion',
            'Retail Segment' : 'retailSegment',
            'Outlet'         : 'outlet',
            'Branch'         : 'branch',
            'Email'          : 'email',
            'PhoneNumber'    : 'phoneNumber',
            'Manager'        : 'manager',
            'Position'       : 'position',
            'Access role'    : 'accessRole',
            'Date of joining': 'dateJoined'
        },
        parsers  : {
            country      : parseStringToArray,
            region       : parseStringToArray,
            subRegion    : parseStringToArray,
            retailSegment: parseStringToArray,
            outlet       : parseStringToArray,
            branch       : parseStringToArray,
            dateJoined   : function (string) {
                return new Date(string);
            }
        },
        ref      : [
            {name: 'country', model: 'domain', type: 'country', idAttribute: 'name.en'},
            {name: 'region', model: 'domain', type: 'region', idAttribute: 'name.en'},
            {name: 'subRegion', model: 'domain', type: 'subRegion', idAttribute: 'name.en'},
            {name: 'retailSegment', model: 'retailSegment', idAttribute: 'name.en'},
            {name: 'outlet', model: 'outlet', idAttribute: 'name.en'},
            {name: 'branch', model: 'branch', idAttribute: 'name.en'},
            {name: 'manager', model: 'personnel'},
            {name: 'position', model: 'position', idAttribute: 'name.en'},
            {name: 'accessRole', model: 'accessRole', idAttribute: 'name.en'}
        ]
    },

    'Brand': {
        modelName: 'brand',
        fields   : {
            'ID'       : 'ID',
            'Name (EN)': 'name.en',
            'Name (AR)': 'name.ar'
        }
    },

    'Category': {
        modelName: 'category',
        fields   : {
            'ID'       : 'ID',
            'Name (EN)': 'name.en',
            'Name (AR)': 'name.ar'
        }
    },

    'Variant': {
        modelName: 'variant',
        fields   : {
            'ID'       : 'ID',
            'Name (EN)': 'name.en',
            'Name (AR)': 'name.ar',
            'Category' : 'category'
        },
        ref      : [
            {name: 'category', model: 'category', idAttribute: 'name.en'}
        ]
    },

    'CVariant': {
        modelName: 'competitorVariant',
        fields   : {
            'ID'       : 'ID',
            'Name (EN)': 'name.en',
            'Name (AR)': 'name.ar',
            'Category' : 'category'
        },
        ref      : [
            {name: 'category', model: 'category', idAttribute: 'name.en'}
        ]
    },

    'Item': {
        modelName: 'item',
        fields   : {
            'ID'       : 'ID',
            'Name (EN)': 'name.en',
            'Name (AR)': 'name.ar',
            'Barcode'  : 'barCode',
            'PPT'      : 'ppt',
            'Origin'   : 'origin',
            'Category' : 'category',
            'Variant'  : 'variant',
            'Country'  : 'country',
            'Packing'  : 'packing'
        },
        parsers  : {
            origin      : parseStringToArray
        },
        ref      : [
            {name: 'country', model: 'domain', type: 'country', idAttribute: 'name.en'},
            {name: 'origin', model: 'origin', idAttribute: 'name.en'},
            {name: 'category', model: 'category', idAttribute: 'name.en'},
            {name: 'variant', model: 'variant', idAttribute: 'name.en'}
        ]
    },

    'CItem': {
        modelName: 'competitorItem',
        fields   : {
            'ID'       : 'ID',
            'Name (EN)': 'name.en',
            'Name (AR)': 'name.ar',
            'Origin'   : 'origin',
            'Variant'  : 'variant',
            'Country'  : 'country',
            'Packing'  : 'packing',
            'Brand'    : 'brand'
        },
        parsers  : {
            origin      : parseStringToArray
        },
        ref      : [
            {name: 'country', model: 'domain', type: 'country', idAttribute: 'name.en'},
            {name: 'origin', model: 'origin', idAttribute: 'name.en'},
            {name: 'category', model: 'category', idAttribute: 'name.en'},
            {name: 'variant', model: 'competitorVariant', idAttribute: 'name.en'},
            {name: 'brand', model: 'brand', idAttribute: 'name.en'}
        ]
    }
};

module.exports = map;
module.exports = {
    ALLOWED_MIME: [{
        "mime"      : "application/vnd.ms-excel",
        "extensions": [
            "xls",
            "xlm",
            "xla",
            "xlc",
            "xlt",
            "xlw"
        ]
    }, {
        "mime"      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "extensions": [
            "xlsx"
        ]
    }, {
        "mime"      : "application/vnd.ms-excel.sheet.macroEnabled.12",
        "extensions": [
            "xlsm"
        ]
    }],

    SHEETS: {
        LOCATION: {
            sheetName: 'Locations',
            header   : ['id', 'enName', 'arName', 'currency', 'type', 'parent'],
            headerRow: {
                id      : 'ID',
                enName  : 'Name (EN)',
                arName  : 'Name (AR)',
                currency: 'Currency',
                type    : 'Type',
                parent  : 'Parent',
            }
        },

        COUNTRY: {
            sheetName: 'Countries',
            header   : ['id', 'enName', 'arName', 'currency', 'type', 'parent'],
            headerRow: {
                id      : 'ID',
                enName  : 'Name (EN)',
                arName  : 'Name (AR)',
                currency: 'Currency',
                type    : 'Type',
                parent  : 'Parent',
            }
        },

        RETAIL_SEGMENT: {
            sheetName: 'Retail Segment',
            header   : ['id', 'enName', 'arName'],
            headerRow: {
                id    : 'ID',
                enName: 'Name (EN)',
                arName: 'Name (AR)',
            }
        },

        OUTLET: {
            sheetName: 'Outlet',
            header   : ['id', 'enName', 'arName'],
            headerRow: {
                id    : 'ID',
                enName: 'Name (EN)',
                arName: 'Name (AR)',
            }
        },

        BRANCH: {
            sheetName: 'Branch',
            header   : ['id', 'enName', 'arName', 'enAddress', 'arAddress', 'subRegion', 'retailSegment', 'outlet'],
            headerRow: {
                id           : 'ID',
                enName       : 'Name (EN)',
                arName       : 'Name (AR)',
                enAddress    : 'Address (EN)',
                arAddress    : 'Address (AR)',
                subRegion    : 'Sub-Region',
                retailSegment: 'Retail Segment',
                outlet       : 'Outlet',
            }
        },

        PERSONNEL: {
            sheetName: 'Personnel',
            header   : [
                'id',
                'enFirstName',
                'arFirstName',
                'enLastName',
                'arLastName',
                'country',
                'region',
                'subRegion',
                'branch',
                'email',
                'phoneNumber',
                'manager',
                'position',
                'accessRole',
                'dateJoined'
            ],

            headerRow: {
                id         : 'ID',
                enFirstName: 'First Name (EN)',
                arFirstName: 'First Name (AR)',
                enLastName : 'Last Name (EN)',
                arLastName : 'Last Name (AR)',
                country    : 'Country',
                region     : 'Region',
                subRegion  : 'Sub-Region',
                branch     : 'Branch',
                email      : 'Email',
                phoneNumber: 'Phone Number',
                manager    : 'Manager',
                position   : 'Position',
                accessRole : 'Access role',
                dateJoined : 'Date of joining'
            }
        },

        POSITION: {
            sheetName: 'Position',
            header   : [
                'id',
                'enName',
                'arName'
            ],

            headerRow: {
                id    : 'ID',
                enName: 'Name (EN)',
                arName: 'Name (AR)'
            }
        },

        ROLE: {
            sheetName: 'Role',
            header   : [
                'id',
                'enName',
                'arName'
            ],

            headerRow: {
                id    : 'ID',
                enName: 'Name (EN)',
                arName: 'Name (AR)'
            }
        },

        ORIGIN: {
            sheetName: 'Origin',
            header   : [
                'id',
                'enName',
                'arName'
            ],

            headerRow: {
                id    : 'ID',
                enName: 'Name (EN)',
                arName: 'Name (AR)'
            }
        },

        BRAND: {
            sheetName: 'Brand',
            header   : [
                'id',
                'enName',
                'arName'
            ],

            headerRow: {
                id    : 'ID',
                enName: 'Name (EN)',
                arName: 'Name (AR)'
            }
        },

        CATEGORY: {
            sheetName: 'Category',
            header   : [
                'id',
                'enName',
                'arName'
            ],

            headerRow: {
                id    : 'ID',
                enName: 'Name (EN)',
                arName: 'Name (AR)'
            }
        },

        VARIANT: {
            sheetName: 'Variant',
            header   : [
                'id',
                'enName',
                'arName',
                'category'
            ],

            headerRow: {
                id      : 'ID',
                enName  : 'Name (EN)',
                arName  : 'Name (AR)',
                category: 'Category'
            }
        },

        COMPETITOR_VARIANT: {
            sheetName: 'Competitor Variant',
            header   : [
                'id',
                'enName',
                'arName',
                'category'
            ],

            headerRow: {
                id      : 'ID',
                enName  : 'Name (EN)',
                arName  : 'Name (AR)',
                category: 'Category'
            }
        },

        ITEM: {
            sheetName: 'Item',
            header   : [
                'id',
                'enName',
                'arName',
                'barcode',
                'packing',
                'ppt',
                'rspMin',
                'rspMax',
                'pptPerCase',
                'origin',
                'category',
                'variant',
                'country'
            ],

            headerRow: {
                id        : 'ID',
                enName    : 'Name (EN)',
                arName    : 'Name (AR)',
                barcode   : 'Barcode',
                packing   : 'Packing',
                ppt       : 'PPT',
                rspMin    : 'RSP (Minimum)',
                rspMax    : 'RSP (Maximum)',
                pptPerCase: 'PPT (Case)',
                origin    : 'Origin',
                category  : 'Category',
                variant   : 'Variant',
                country   : 'Country'
            }
        },

        COMPETITOR_ITEM: {
            sheetName: 'Competitor Item',
            header   : [
                'id',
                'enName',
                'arName',
                'size',
                'origin',
                'brand',
                'variant',
                'country'
            ],

            headerRow: {
                id     : 'ID',
                enName : 'Name (EN)',
                arName : 'Name (AR)',
                size   : 'Size',
                origin : 'Origin',
                brand  : 'Brand',
                variant: 'Variant',
                country: 'Country'
            }
        },

        DISPLAY: {
            sheetName: 'Display',
            header   : [
                'id',
                'enName',
                'arName'
            ],

            headerRow: {
                id    : 'ID',
                enName: 'Name (EN)',
                arName: 'Name (AR)'
            }
        }
    }
};

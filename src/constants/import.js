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
        }
    }
};

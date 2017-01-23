define([
        'Underscore',
        'translations/en/pagination',
        'translations/en/filters'
    ],
    function (_, paginationTranslation, filtersTranslation) {
        var translation = {
            all         : 'Competitor promotion activities',
            title       : 'Competitors promo evaluation report',
            category    : 'Category',
            brand       : 'Brand',
            origin      : 'Origin',
            promotion   : 'Promotion',
            rsp         : 'RSP',
            packing     : 'Weight',
            expiry      : 'Expiry',
            employee    : 'Employee',
            country     : 'Country',
            region      : 'Region',
            subRegion   : 'Sub-Region',
            tradeChannel: 'Trade Channel',
            outlet      : 'Customer',
            branch      : 'Branch',
            displayType : 'Display Type',
            startDate   : 'Start Date',
            endDate     : 'End Date',
            description : 'Description',
            attachments : 'Attachments',
            files       : 'Files',
            attach      : 'Attach',
            send        : 'Send',
            location    : 'Location',
            commentText : 'Comment Text',
            okBtn       : 'Ok',
            dialogTitle : 'Comment attachments',
            goToBtn : 'Go to'
        };
        return _.extend({}, paginationTranslation, filtersTranslation, translation);
    });


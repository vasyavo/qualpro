var populateOptionsByType = {
    country: {
        by: 'currency'
    },
    branch : {
        by    : 'manager',
        fields: 'phoneNumber email firstName lastName fullName'
    }
};

module.exports = function (query, type) {
    var opt = populateOptionsByType[type];
    var ref;
    var fields;

    if (!opt) {
        return query;
    }

    ref = opt.by;
    fields = opt.fields;

    return fields ? query.populate(ref, fields) : query.populate(ref);
};

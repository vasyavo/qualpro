const analyzeByMethods = {
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
    product: require('./analyzeByProduct'),
    publisherPosition: require('./analyzeByPublisherPosition'),
    publisher: require('./analyzeByPublisher'),
    assignee: require('./analyzeByAssignee'),
    promotionType: require('./analyzeByDetails'),
};

module.exports = (pipeline, analyzeBy, queryFilter) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline, queryFilter);
    }

    return analyzeByMethods.country(pipeline);
};

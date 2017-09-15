const analyzeByMethods = {
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
    publisher: require('./analyzeByPublisher'),
    publisherPosition: require('./analyzeByPublisherPosition'),
    brand: require('./analyzeByBrand'),
    product: require('./analyzeByProduct'),
};

module.exports = (pipeline, analyzeBy) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline);
    }

    return analyzeByMethods.publisher(pipeline);
};

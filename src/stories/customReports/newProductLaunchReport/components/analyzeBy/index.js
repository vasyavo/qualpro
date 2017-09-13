const analyzeByMethods = {
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
    brand: require('./analyzeByBrand'),
    variant: require('./analyzeByVariant'),
    product: require('./analyzeByProduct'),
    publisherPosition: require('./analyzeByPublisherPosition'),
    publisher: require('./analyzeByPublisher'),
};

module.exports = (pipeline, analyzeBy) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline);
    }

    return analyzeByMethods.publisher(pipeline);
};

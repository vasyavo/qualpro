module.exports = (queryFilter, personnel, CONTENT_TYPE) => {
    if (queryFilter[CONTENT_TYPE] && queryFilter[CONTENT_TYPE].length) {
        return queryFilter[CONTENT_TYPE];
    }

    if (personnel[CONTENT_TYPE] && personnel[CONTENT_TYPE].length) {
        return personnel[CONTENT_TYPE];
    }

    return null;
};

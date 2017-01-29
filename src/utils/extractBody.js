module.exports = (body) => {
    try {
        if (body.data) {
            return JSON.parse(body.data);
        }
    } catch (err) {
        throw err;
    }

    return body;
};

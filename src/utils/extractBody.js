module.exports = (body, cb) => {
    try {
        if (body.data) {
            return JSON.parse(body.data);
        }
    } catch (err) {
        cb(err);
    }

    return body;
};

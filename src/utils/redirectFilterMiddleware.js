module.exports = (req, res, next) => {
    if (req.method === 'POST') {
        req.method = 'GET';

        try  {
            req.query = JSON.parse(req.body.query);
        } catch (ex) {
            return next(ex);
        }
    }

    next();
};

const RESPONSES = require('./../constants/responses');

module.exports = (req, res, next) => {
    res.status(404);

    if (req.accepts('html')) {
        return res.send(RESPONSES.PAGE_NOT_FOUND);
    }

    if (req.accepts('json')) {
        return res.json({error : RESPONSES.PAGE_NOT_FOUND});

    }

    res.type('txt');
    res.send(RESPONSES.PAGE_NOT_FOUND);
};

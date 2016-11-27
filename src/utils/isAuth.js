module.exports = (req, res, next) => {
    if (req.session && req.session.loggedIn) {
        return next();
    }

    res.send(401);
};

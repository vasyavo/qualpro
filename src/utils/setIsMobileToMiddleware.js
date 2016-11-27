module.exports = function(req, res, next) {
    req.isMobile = true;

    next();
};

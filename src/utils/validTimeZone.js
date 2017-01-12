module.exports = (req, res, next) => {
    const serverDate = new Date();

    if (!req.headers.hasOwnProperty('clientdate')) {
        return next();
    }

    const clientDateAsHeader = req.headers.clientdate;
    const clientDate = new Date(clientDateAsHeader);
    const isMobile = req.isMobile;
    const allowedDifference = 60 * 60 * 24 * 1000; //24 hours
    const isClientDateValid = clientDateAsHeader && clientDate && Math.abs(clientDate - serverDate) < allowedDifference;

    if (!isMobile && !isClientDateValid) {
        const error = new Error('Your system time is incorrect');

        error.status = 400;
        return next(error);
    }

    next();
};

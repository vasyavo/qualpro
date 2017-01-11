module.exports = (req, res, next) => {
    const serverDate = new Date();

    if (!req.headers.hasOwnProperty('clientdate')) {
        return next();
    }

    const clientDate = new Date(req.headers.clientdate);
    const isMobile = req.isMobile;
    const allowedDifference = 60 * 5 * 1000; // 5 minutes
    const isClientDateValid = !clientDate || Math.abs(clientDate - serverDate) > allowedDifference;

    if (!isMobile && !isClientDateValid) {
        const error = new Error('Your system time is incorrect');

        error.status = 400;
        return next(error);
    }

    next();
};

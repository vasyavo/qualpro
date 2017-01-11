module.exports = (req, res, next) => {
    const serverDate = new Date();

    const clientDate = req.headers.clientdate;

    const isMobile = req.isMobile; // dont work on mobile app

    const allowedDifference = 5 * 1000 * 60;

    if (!isMobile && (!clientDate || Math.abs(new Date(clientDate) - serverDate) > allowedDifference)){
        const error = new Error('Your system time is incorrect');
        error.status = 400;
        return next(error);
    }


    next();
};

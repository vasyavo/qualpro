const ACL_ROLES = require('../constants/aclRolesNames');

module.exports = (req, res, next) => {
    const session = req.session;

    if (session.onLeave) {
        if (session.level ===  ACL_ROLES.MASTER_ADMIN || session.level === ACL_ROLES.COUNTRY_ADMIN) {
            return next();
        }

        const error = new Error();
        error.status = 403;
        error.message = 'Forbidden';

        return next(error);
    }

    next();
};
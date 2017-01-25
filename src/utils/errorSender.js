const ERROR_DESCRIPTIONS = require('../constants/errorDescriptions');
const ERROR_MESSAGES = require('../constants/errorMessages');

const getErrorDescription = (errorKey) => {
    return Object.assign({
        en: '',
        ar: ''
    }, ERROR_DESCRIPTIONS[errorKey])
};

const customError = (callback, options, excludeFromStackTrace = customError) => {
    const {
        status = 400,
        message = ''
    } = options;
    
    const err = new Error(message);
    
    err.status = status;
    err.description = getErrorDescription(message);
    
    // used to exclude auxiliary functions from stack trace
    Error.captureStackTrace(err, excludeFromStackTrace);
    
    callback(err);
};


const badRequest = (cb, message = ERROR_MESSAGES.BAD_REQUEST) => {
    customError(cb, {status: 400, message}, badRequest);
};

const notAuthorized = (cb, message = ERROR_MESSAGES.NOT_AUTHORIZED) => {
    customError(cb, {status: 401, message}, notAuthorized);
};

const forbidden = (cb, message = ERROR_MESSAGES.FORBIDDEN) => {
    customError(cb, {status: 403, message}, forbidden);
};

module.exports = {
    custom: customError,
    badRequest,
    notAuthorized,
    forbidden
};


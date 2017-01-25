const ERROR_MSG = require('./errorMessages');
const errorDescriptions = {};


/*
 * GLOBAL
 */

errorDescriptions[ERROR_MSG.UNHANDLED_ERROR] = {
    en: 'Something went wrong...',
    ar: 'Something went wrong...'
};

errorDescriptions[ERROR_MSG.BAD_REQUEST] = {
    en: 'Bad Request',
    ar: 'Bad Request'
};

errorDescriptions[ERROR_MSG.NOT_AUTHORIZED] = {
    en: 'Not Authorized',
    ar: 'Not Authorized'
};

errorDescriptions[ERROR_MSG.FORBIDDEN] = {
    en: 'Forbidden',
    ar: 'Forbidden'
};

errorDescriptions[ERROR_MSG.NOT_ENOUGH_PARAMS] = {
    en: 'Not Enough Params.',
    ar: 'Not Enough Params.'
};

errorDescriptions[ERROR_MSG.NOT_VALID_PARAMS] = {
    en: 'Not valid incoming parameters',
    ar: 'Not valid incoming parameters'
};

/*
 * PERSONNEL - LOGIN, REGISTRATION
 */

errorDescriptions[ERROR_MSG.INCORRECT_PASSWORD] = {
    en: 'Please enter the correct password.',
    ar: 'يرجى إدخال كلمة المرور الصحيحة'
};

errorDescriptions[ERROR_MSG.INVALID_CREDENTIALS] = {
    en: 'Invalid credentials. Please try again.',
    ar: 'بيانات الدخول غير صحيحة. حاول مرة اخرى'
};

errorDescriptions[ERROR_MSG.ACCOUNT_IS_NOT_CONFIRMED] = {
    en: 'Your account is not confirmed. Please check your email or phone.',
    ar: 'Your account is not confirmed. Please check your email or phone.'
};

errorDescriptions[ERROR_MSG.ACCOUNT_IS_BLOCKED] = {
    en: 'Your account is blocked. Please contact with administration.',
    ar: 'Your account is blocked. Please contact with administration.'
};

errorDescriptions[ERROR_MSG.FORBIDDEN_LOGIN_TO_CMS] = {
    en: 'You can not login to CMS.',
    ar: 'You can not login to CMS.'
};

errorDescriptions[ERROR_MSG.FORBIDDEN_LOGIN_FROM_APP] = {
    en: 'You can not login from application.',
    ar: 'You can not login from application.'
};


errorDescriptions[ERROR_MSG.USER_LOCATION_IS_NOT_SPECIFIED] = {
    en: 'You have no location. Please contact with administration.',
    ar: 'You have no location. Please contact with administration.'
};

errorDescriptions[ERROR_MSG.USER_NOT_FOUND] = {
    en: 'User not found.',
    ar: 'User not found.'
};

errorDescriptions[ERROR_MSG.EMAIL_IS_NOT_VALID] = {
    en: 'Email is invalid.',
    ar: 'Email is invalid.'
};

errorDescriptions[ERROR_MSG.INCORRECT_VERIFICATION_CODE] = {
    en: 'The verification code you entered is incorrect. Please try again.',
    ar: 'رمز التحقق الذي قمت بإدخاله غير صحيح، يرجى المحاولة مرة أخرى.'
};

module.exports = errorDescriptions;

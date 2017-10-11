var App = require('./appState');

// Removed cyrillic chars
var phoneRegExp = /^[0-9\+]?([0-9-\s()])+[0-9()]$/;
var intNumberRegExp = /[0-9]+/;
var priceQualProRegExp = /(^[0-9]+(\.[0-9]{1,4})?)$/;
var floatNumberRegExp = /(^[0-9]+(\.[0-9]{1,2})?)$/;
var nameRegExp = /^[a-zA-Z]+[a-zA-Z-_\s]|[\u0621-\u064A\u0660-\u0669 ]+$/;
var groupsNameRegExp = /[a-zA-Z0-9]+[a-zA-Z0-9-,#@&*-_\s()\.\/\s]|[\u0621-\u064A\u0660-\u0669 ]+$/;
var loginRegExp = /[\w\.@]{4,100}$/;
var passRegExp = /^[\w\.@]{3,100}$/;
var skypeRegExp = /^[\w\._@]{6,100}$/;
var workflowRegExp = /^[a-zA-Z0-9\s]{2,100}$/;
var invalidCharsRegExp = /[~<>\^\*₴]/;
var invalidCharsRegExpForDescription = /[~\^\*₴]/;
var countryRegExp = /[a-zA-Z\s-]+/;
var zipRegExp = /[a-zA-Z0-9\s-]+$/;
var streetRegExp = /^[a-zA-Z0-9\s][a-zA-Z0-9-,\s\.\/\s]+$/;
var moneyAmountRegExp = /^([0-9]{1,9})\.?([0-9]{1,2})?$/;
var emailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var loggedRegExp = /^([0-9]{1,9})\.?([0-9]{1,2})?$/;
var domainNameRegExp = /[()a-zA-Z\s-]|[\u0621-\u064A\u0660-\u0669 ]/;
var checkForHexRegExp = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i;
var MIN_LENGTH = 2;
var LOGIN_MIN_LENGTH = 4;
var WORKFLOW_MIN_LENGTH = 3;

var validateEmail = function (validatedString) {
    return emailRegExp.test(validatedString);
};

var validateLogin = function (validatedString) {
    return loginRegExp.test(validatedString);
};

var validateSkype = function (validatedString) {
    return skypeRegExp.test(validatedString);
};

var validateZip = function (validatedString) {
    return zipRegExp.test(validatedString);
};

var requiredFieldLength = function (validatedString) {
    return validatedString.length >= MIN_LENGTH;
};

var validatePhone = function (validatedString) {
    return phoneRegExp.test(validatedString);
};

var validateName = function (validatedString) {
    return nameRegExp.test(validatedString);
};

var validateDomainName = function (validatedString) {
    return domainNameRegExp.test(validatedString);
};

var validateGroupsName = function (validatedString) {
    return groupsNameRegExp.test(validatedString);
};

var validateWorkflowName = function (validatedString) {
    return workflowRegExp.test(validatedString);
};

var validatePass = function (validatedString) {
    return passRegExp.test(validatedString);
};

var validateCountryName = function (validatedString) {
    return countryRegExp.test(validatedString);
};

var validateStreet = function (validatedString) {
    return streetRegExp.test(validatedString);
};

var validateLoggedValue = function (validatedString) {
    return loggedRegExp.test(validatedString);
};

var validateFloat = function (validatedString) {
    return floatNumberRegExp.test(validatedString);
};

var validatePrice = function (validatedString) {
    return priceQualProRegExp.test(validatedString);
};

var validateNumber = function (validatedString) {
    return intNumberRegExp.test(validatedString);
};

var validateMoneyAmount = function (validatedString) {
    return moneyAmountRegExp.test(validatedString);
};

var validDate = function (validatedString) {
    return new Date(validatedString).getMonth() ? true : false;
};

var hasInvalidChars = function (validatedString) {
    return invalidCharsRegExp.test(validatedString);
};

var hasInvalidCharsForDescription = function (validatedString) {
    return invalidCharsRegExpForDescription.test(validatedString);
};

var hasInvalidMongoId = function (validatedString) {
    return checkForHexRegExp.test(validatedString);
};

var errorMessages = {
    en: {
        userName                  : "field value is incorrect. It should contain only the following symbols: A-Z, a-z",
        invalidNameMsg            : "field value is incorrect. It should start with letter or number",
        invalidLoginMsg           : "field value is incorrect. It should contain only the following symbols: A-Z, a-z, 0-9, _ @",
        notNumberMsg              : "field should contain a valid integer value",
        notPriceMsg               : "field should contain a valid price value with only 4 digits after dot and contain only the following symbols: 0-9, .",
        invalidCountryMsg         : "field should contain only letters, whitespaces and '-' sign",
        loggedNotValid            : "field should contain a valid decimal value with max 1 digit after dot",
        minLengthMsg              : function (minLength) {
            return "field should be at least " + minLength + " characters long"
        },
        phoneLengthMsg            : function (length) {
            return "field should be " + length + " characters long"
        },
        invalidMoneyAmountMsg     : "field should contain a number with max 2 digits after dot",
        invalidEmailMsg           : "field should contain a valid email address",
        requiredMsg               : "field can not be empty",
        invalidCharsMsg           : "field can not contain '~ < > ^ * ₴' signs",
        invalidCharsMsgDescription: "field can not contain '~ ^ * ₴' signs",
        invalidStreetMsg          : "field can contain only letters, numbers and '. , - /' signs",
        invalidPhoneMsg           : "field should contain only numbers and '+ - ( )' signs",
        invalidZipMsg             : "field should contain only letters, numbers and '-' sing",
        passwordsNotMatchMsg      : "Password and confirm password field do not match"
    },
    ar: {
        userName         : "البيانات المدخلة غير صحيحة. يجب أن تحتوي فقط على  حروف ابجدية من (أ الى ى)",
        invalidNameMsg   : "لبيانات المدخلة غير صحيحة. يجب أن تبدأ بحرف أو رقم ",
        invalidLoginMsg  : "البيانات المدخلة غير صحيحة. يجب أن تحتوي فقط على حروف ابجدية من (أ  الى ى)، او ارقام من (1 الى 9)، او رموز مثل (_ / @) ",
        notNumberMsg     : "يجب أن تحتوى البيانات المدخلة على قيمة عدد صحيح صالحة",
        notPriceMsg      : "يجب أن يحتوي الحقل على قيمة سعر صالحة مع 4 أرقام فقط بعد النقطة وتحتوي فقط على الرموز التالية: 0-9",
        invalidCountryMsg: "يجب أن تحتوى البيانات المدخلة على  حروف فقط، المساحات فارغة، او رمز '-' ",
        loggedNotValid   : "يجب أن تحتوى البيانات المدخلة على قيمة عشرية صالحة مع إضافة رقم أحادي بعد النقطة (.) ",
        minLengthMsg     : function (minLength) {
            return "يجب أن يشمل حقل الادخال على الأقل" + minLength + " الاحرف"
        },

        phoneLengthMsg: function (length) {
            return "يجب أن يشمل حقل الادخال على الأقل" + length + "الاحرف"
        },

        invalidMoneyAmountMsg     : "يجب أن تحتوى البيانات المدخلة على عدد مع حد أقصى رقمين بعد النقطة (.)",
        invalidEmailMsg           : "يجب أن تحتوى البيانات المدخلة على عنوان بريد إلكتروني صالح",
        invalidCharsMsgDescription: "لا يمكن لحقل ادخال البيانات ان يشمل رموز وعلامات مثل '~ ^ * ₴'",
        requiredMsg               : "حقل ادخال البيانات لا يمكن أن يكون فارغا",
        invalidCharsMsg           : "'~ < > ^ * ?' لا يمكن لحقل ادخال البيانات ان يشمل رموز او علامات مثل ",
        invalidStreetMsg          : "حقل ادخال البيانات يمكن ان يحتوى على احرف او ارقام او رموز مثل  '. , - /' فقط ",
        invalidPhoneMsg           : "حقل ادخال البيانات يمكن ان يحتوى على ارقام وعلامات مثل '+ - ( )' فقط",
        invalidZipMsg             : "حقل ادخال البيانات يمكن ان يحتوى على حروف او ارقام او رموز مثل '-' فقط",
        passwordsNotMatchMsg      : "كلمة المرور وتأكيد حقل ادخال تكرار كلمة المرور غير متطابقين "
    }

};

var checkNameField = function (errorArray, required, fieldValue, fieldName) {
    var languageKey = App.currentUser.currentLanguage;
    var isObject = typeof fieldValue === 'object';
    var keys;
    var nameErrors = [];
    if (!isObject) {
        if (required) {
            if (!fieldValue) {
                errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
                return;
            }
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].invalidCharsMsg].join(' '));
                return;
            }
            if (fieldValue.length < MIN_LENGTH) {
                errorArray.push([fieldName, errorMessages[languageKey].minLengthMsg(MIN_LENGTH)].join(' '));
                return;
            }
            if (!validateName(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].userName].join(' '));
            }
        } else {
            if (fieldValue) {
                if (hasInvalidChars(fieldValue)) {
                    errorArray.push([fieldName, errorMessages[languageKey].invalidCharsMsg].join(' '));
                    return;
                }
                if (!validateName(fieldValue)) {
                    errorArray.push([fieldName, errorMessages[languageKey].userName].join(' '));
                }
            }
        }
    } else {
        keys = Object.keys(fieldValue);
        if (!keys.length) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
            return;
        }
        keys.forEach(function (key) {
            if (!fieldValue[key]) {
                errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
                return;
            }
            if (hasInvalidChars(fieldValue[key])) {
                nameErrors.push([fieldName, errorMessages[languageKey].invalidCharsMsg].join(' '));
                errorArray.push([fieldName, errorMessages[languageKey].invalidCharsMsg].join(' '));
                return;
            }
            if (fieldValue[key].length < MIN_LENGTH) {
                nameErrors.push([fieldName, errorMessages[languageKey].minLengthMsg(MIN_LENGTH)].join(' '));
                errorArray.push([fieldName, errorMessages[languageKey].minLengthMsg(MIN_LENGTH)].join(' '));
                return;
            }
            if (!validateName(fieldValue[key])) {
                nameErrors.push([fieldName, errorMessages[languageKey].userName].join(' '));
                errorArray.push([fieldName, errorMessages[languageKey].userName].join(' '));
            }
        });

        if (nameErrors.length === 2) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
        }
    }
};

var checkForValuePresence = function (errorArray, required, fieldValue, fieldName) {
    var languageKey = App.currentUser.currentLanguage;
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
            return;
        }
        if (Array.isArray(fieldValue) && !fieldValue.length) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
            return;
        }
    }
};

var checkTitleField = function (errorArray, required, fieldValue, fieldName) {
    var languageKey = App.currentUser.currentLanguage;
    var isObject = typeof fieldValue === 'object';
    var keys = fieldValue && isObject ? Object.keys(fieldValue) : [];
    var titleErrors = [];
    if (required && isObject) {
        if (!fieldValue || !keys.length) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
            return;
        }
        keys.forEach(function (key) {
            if (hasInvalidCharsForDescription(fieldValue[key])) {
                titleErrors.push(1);
                return;
            }
            if (fieldValue[key].length < MIN_LENGTH) {
                titleErrors.push(2);
            }
        });
        if (titleErrors.length === 2) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
        }
    } else {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
        }
    }
};

var checkDescriptionField = function (errorArray, required, fieldValue, fieldName) {
    var languageKey = App.currentUser.currentLanguage;
    var isObject = typeof fieldValue === 'object';
    var keys = fieldValue ? Object.keys(fieldValue) : [];
    var descriptionErrors = [];
    if (!isObject) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
        }
        return;
    }
    if (required) {
        if (!fieldValue || !keys.length) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
            return;
        }

        keys.forEach(function (key) {
            if (hasInvalidCharsForDescription(fieldValue[key])) {
                descriptionErrors.push(1);
                return;
            }
            if (fieldValue[key].length < MIN_LENGTH) {
                descriptionErrors.push(2);
            }
        });
    } else {
        if (fieldValue && keys.length) {
            keys.forEach(function (key) {
                if (hasInvalidCharsForDescription(fieldValue[key])) {
                    descriptionErrors.push(1);
                }
            });
        }
    }
    if (descriptionErrors.length === 2) {
        errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
    }
};

var checkForValidMongoId = function (errorArray, required, fieldValue, fieldName) {
    var languageKey = App.currentUser.currentLanguage;
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
            return;
        }
        if (hasInvalidMongoId(fieldValue)) {
            errorArray.push([fieldName, errorMessages[languageKey].invalidCharsMsg].join(' '));
            return;
        }
        if (fieldValue.length < MIN_LENGTH) {
            errorArray.push([fieldName, errorMessages[languageKey].minLengthMsg(MIN_LENGTH)].join(' '));
            return;
        }
        if (!validateName(fieldValue)) {
            errorArray.push([fieldName, errorMessages[languageKey].userName].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].invalidCharsMsg].join(' '));
                return;
            }
            if (!validateName(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].userName].join(' '));
            }
        }
    }
};

var checkDomainNameField = function (errorArray, required, fieldValue, fieldName) {
    var languageKey = App.currentUser.currentLanguage;
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages[languageKey].invalidCharsMsg].join(' '));
            return;
        }
        if (!validateDomainName(fieldValue)) {
            errorArray.push([fieldName, errorMessages[languageKey].userName].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].invalidCharsMsg].join(' '));
                return;
            }
            if (!validateName(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].userName].join(' '));
            }
        }
    }
};

var checkLogedField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (fieldValue.length < MIN_LENGTH) {
            errorArray.push([fieldName, errorMessages.minLengthMsg(MIN_LENGTH)].join(' '));
            return;
        }
        if (!validateLoggedValue(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidNameMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (!validateLoggedValue(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidNameMsg].join(' '));
            }
        }
    }
};

var checkPriceField = function (errorArray, required, fieldValue, fieldName) {
    var languageKey = App.currentUser.currentLanguage;
    if (required) {
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages[languageKey].notPriceMsg].join(' '));
            return;
        }
        if (!validatePrice(fieldValue)) {
            errorArray.push([fieldName, errorMessages[languageKey].notPriceMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].notPriceMsg].join(' '));
                return;
            }
            if (!validatePrice(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].notPriceMsg].join(' '));
            }
        }
    }
};

var checkNumberField = function (errorArray, required, fieldValue, fieldName) {
    var languageKey = App.currentUser.currentLanguage;
    if (required) {
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages[languageKey].notNumberMsg].join(' '));
            return;
        }
        if (!validateNumber(fieldValue)) {
            errorArray.push([fieldName, errorMessages[languageKey].notNumberMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].notNumberMsg].join(' '));
                return;
            }
            if (!validateNumber(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].notNumberMsg].join(' '));
            }
        }
    }
};

var checkGroupsNameField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (fieldValue.length < MIN_LENGTH) {
            errorArray.push([fieldName, errorMessages.minLengthMsg(MIN_LENGTH)].join(' '));
            return;
        }
        if (!validateGroupsName(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidNameMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (!validateGroupsName(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidNameMsg].join(' '));
            }
        }
    }
};

var checkLoginField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (fieldValue.length < LOGIN_MIN_LENGTH) {
            errorArray.push([fieldName, errorMessages.minLengthMsg(LOGIN_MIN_LENGTH)].join(' '));
            return;
        }
        if (!validateLogin(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidLoginMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (fieldValue.length < MIN_LENGTH) {
                errorArray.push([fieldName, errorMessages.minLengthMsg(6)].join(' '));
                return;
            }
            if (!validateName(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidLoginMsg].join(' '));
            }
        }
    }
};

var checkSkypeField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (fieldValue.length < 6) {
            errorArray.push([fieldName, errorMessages.minLengthMsg(6)].join(' '));
            return;
        }
        if (!validateWorkflowName(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidLoginMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (fieldValue.length < 6) {
                errorArray.push([fieldName, errorMessages.minLengthMsg(6)].join(' '));
                return;
            }
            if (!validateSkype(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidLoginMsg].join(' '));
            }
        }
    }

};

var checkWorkflowNameField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (fieldValue.length < 3) {
            errorArray.push([fieldName, errorMessages.minLengthMsg(WORKFLOW_MIN_LENGTH)].join(' '));
            return;
        }
        if (!validateWorkflowName(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidLoginMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (fieldValue.length < WORKFLOW_MIN_LENGTH) {
                errorArray.push([fieldName, errorMessages.minLengthMsg(3)].join(' '));
                return;
            }
            if (!validateName(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidLoginMsg].join(' '));
            }
        }
    }
};

var checkPhoneField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (fieldValue.length < 5) {
            errorArray.push([fieldName, errorMessages.minLengthMsg(5)].join(' '));
            return;
        }
        if (!validatePhone(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidPhoneMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (fieldValue.length < 12) {
                errorArray.push([fieldName, errorMessages.phoneLengthMsg(12)].join(' '));
                return;
            }
            if (!validatePhone(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidPhoneMsg].join(' '));
            }
        }
    }
};

var checkCountryCityStateField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (!validateCountryName(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCountryMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (!validateCountryName(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCountryMsg].join(' '));
            }
        }
    }
};

var checkZipField = function (errorArray, required, fieldValue, fieldName) {
    var languageKey = App.currentUser.currentLanguage;
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages[languageKey].invalidCharsMsg].join(' '));
            return;
        }
        if (!validateZip(fieldValue)) {
            errorArray.push([fieldName, errorMessages[languageKey].invalidZipMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].invalidCharsMsg].join(' '));
                return;
            }
            if (!validateZip(fieldValue)) {
                errorArray.push([fieldName, errorMessages[languageKey].invalidZipMsg].join(' '));
            }
        }
    }
};

var checkStreetField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (!validateStreet(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidStreetMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (!validateStreet(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidStreetMsg].join(' '));
            }
        }
    }
};

var checkJobPositionField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
    }
};

var checkEmailField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (!validateEmail(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidEmailMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (!validateEmail(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidEmailMsg].join(' '));
            }
        }
    }
};

var checkNotesField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            }
        }
    }
};

var checkMoneyField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (!validateMoneyAmount(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidMoneyAmountMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (!validateMoneyAmount(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidMoneyAmountMsg].join(' '));
            }
        }
    }
};

var checkPasswordField = function (errorArray, required, fieldValue, fieldName) {
    if (required) {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (fieldValue.length < 3) {
            errorArray.push([fieldName, errorMessages.minLengthMsg(3)].join(' '));
            return;
        }
        if (!validatePass(fieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidLoginMsg].join(' '));
        }
    } else {
        if (fieldValue) {
            if (hasInvalidChars(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
                return;
            }
            if (fieldValue.length < 3) {
                errorArray.push([fieldName, errorMessages.minLengthMsg(3)].join(' '));
                return;
            }
            if (!validatePass(fieldValue)) {
                errorArray.push([fieldName, errorMessages.invalidLoginMsg].join(' '));
            }
        }
    }
};

var comparePasswords = function (errorArray, password, confirmPass) {
    if (password && confirmPass) {
        if (password !== confirmPass) {
            errorArray.push(errorMessages.passwordsNotMatchMsg);
        }
    }
};

var checkFirstDateIsGreater = function (errorArray, greaterDate, greaterDateName, smallerDate, smallerDateName) {
    if ((new Date(greaterDate) < new Date(smallerDate))) {
        errorArray.push(smallerDateName + " can not be greater than " + greaterDateName);
        return;
    }

};

var checkMultiLanguageField = function (errorArray, required, enFieldValue, arFieldValue, fieldName) {
    if (required) {
        if (!enFieldValue && !arFieldValue) {
            errorArray.push([fieldName, errorMessages.requiredMsg].join(' '));
            return;
        }
        if (hasInvalidChars(enFieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (hasInvalidChars(arFieldValue)) {
            errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            return;
        }
        if (enFieldValue && enFieldValue.length < MIN_LENGTH) {
            errorArray.push([fieldName, errorMessages.minLengthMsg(MIN_LENGTH)].join(' '));
            return;
        }
        if (arFieldValue && arFieldValue.length < MIN_LENGTH) {
            errorArray.push([fieldName, errorMessages.minLengthMsg(MIN_LENGTH)].join(' '));
            return;
        }
        if (enFieldValue && !validateName(enFieldValue)) {
            return errorArray.push([fieldName, errorMessages.userName].join(' '));
        }
        if (arFieldValue && !validateName(arFieldValue)) {
            return errorArray.push([fieldName, errorMessages.userName].join(' '));
        }
    } else {
        if (enFieldValue) {
            if (hasInvalidChars(enFieldValue)) {
                return errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            }
            if (!validateName(enFieldValue)) {
                return errorArray.push([fieldName, errorMessages.userName].join(' '));
            }
        }
        if (arFieldValue) {
            if (hasInvalidChars(arFieldValue)) {
                return errorArray.push([fieldName, errorMessages.invalidCharsMsg].join(' '));
            }
            if (!validateName(arFieldValue)) {
                return errorArray.push([fieldName, errorMessages.userName].join(' '));
            }
        }
    }
};

var checkQuestionOptionField = function (errorArray, required, fieldValue, fieldName) {
    var languageKey = App.currentUser.currentLanguage;
    var isObject = typeof fieldValue === 'object';
    var keys = fieldValue && isObject ? Object.keys(fieldValue) : [];
    var titleErrors = [];
    if (required && isObject) {
        if (!fieldValue || !keys.length) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
            return;
        }
        keys.forEach(function (key) {
            if (fieldValue[key].length < MIN_LENGTH) {
                titleErrors.push(2);
            }
        });
        if (titleErrors.length === 2) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
        }
    } else {
        if (!fieldValue) {
            errorArray.push([fieldName, errorMessages[languageKey].requiredMsg].join(' '));
        }
    }
};

module.exports = {
    comparePasswords          : comparePasswords,
    checkPasswordField        : checkPasswordField,
    checkLoginField           : checkLoginField,
    checkMoneyField           : checkMoneyField,
    checkFirstDateIsGreater   : checkFirstDateIsGreater,
    checkNotesField           : checkNotesField,
    checkEmailField           : checkEmailField,
    checkStreetField          : checkStreetField,
    checkZipField             : checkZipField,
    checkCountryCityStateField: checkCountryCityStateField,
    checkPhoneField           : checkPhoneField,
    checkNameField            : checkNameField,
    checkGroupsNameField      : checkGroupsNameField,
    validEmail                : validateEmail,
    withMinLength             : requiredFieldLength,
    validLoggedValue          : validateLoggedValue,
    errorMessages             : errorMessages,
    checkNumberField          : checkNumberField,
    validStreet               : validateStreet,
    validDate                 : validDate,
    validPhone                : validatePhone,
    validName                 : validateName,
    validGroupsName           : validateGroupsName,
    validMoneyAmount          : validateMoneyAmount,
    checkLogedField           : checkLogedField,
    checkWorkflowNameField    : checkWorkflowNameField,
    checkSkypeField           : checkSkypeField,
    checkPriceField           : checkPriceField,
    checkJobPositionField     : checkJobPositionField,
    checkMultiLanguageField   : checkMultiLanguageField,
    checkDomainNameField      : checkDomainNameField,
    checkDescriptionField     : checkDescriptionField,
    checkForValuePresence     : checkForValuePresence,
    checkForValidMongoId      : checkForValidMongoId,
    checkTitleField           : checkTitleField,
    checkQuestionOptionField: checkQuestionOptionField,
    hasInvalidChars : hasInvalidChars
};

'use strict';

(function () {
    var root;

    var ERRORMESSAGES = {
        documentArchiveForbidden: {
            en: 'Document is in use and can\'t be archive',
            ar: 'المستند قيد الاستخدام ولا يمكن حفظه فى الارشيف'
        },
        brandingTableIsEmpty: {
            en: 'Branding and display items table is empty',
            ar: ' جدول العلامات التجارية وتقارير العرض للسلع لا يحتوى على بيانات '
        },
        forbiddenTypeOfFile: {
            en: 'You\'ve chosen forbidden type of file',
            ar: 'لا يمكن ارفاق هذا النوع من الملفات'
        },
        canNotGetBrands: {
            en: 'Can not get Brands',
            ar: 'لا يمكن الحصول على منافسين'
        },
        notValidData: {
            en: 'Not valid data',
            ar: 'البيانات المدخلة غير صالحة'
        },
        checkYourEmail: {
            en: 'Check your email',
            ar: ' تحقق من عنوان البريد الإلكتروني الخاص بك'
        },
        fileIsNotUploaded: {
            en: 'Please send/save the task to view the files',
            ar: ' يرجى ارسال / حفظ المهمة لمشاهدة ملفات'
        },
        locationNotSelected: {
            en: 'Location not selected',
            ar: 'لم يتم اختيار المواقع'
        },
        invalidCredentials: {
            en: 'Invalid credentials. Please try again',
            ar: ' بيانات الدخول غير صحيحة. حاول مرة اخرى'
        },
        inStoreNotSaved: {
            en: 'In-store reporting not saved',
            ar: 'لم يتم حفظ بيانات المهمة فى المتجر'
        },
        objectiveNotSaved: {
            en: 'Objective not saved',
            ar: 'لم يتم حفظ بيانات الهدف'
        },
        unArchiveError: {
            en: 'Un archive error',
            ar: ' خطأ إلغاء الأرشفة'
        },
        unArchiveSuccess: {
            en: 'Un archive successful',
            ar: 'تم إلغاءالارشفة بنجاح '
        },
        passwordLength: {
            en: 'Password must be longer than 6 characters',
            ar: 'يجب ان تحتوى كلمة المرور على اكثر من ثلاثة احرف'
        },
        canNotFetchCurrentUser: {
            en: 'Can\'t fetch currentUser',
            ar: 'لا يمكن العثور على المستخدم الحالى'
        },
        suchUserNotRegistered: {
            en: 'Such user is not registered',
            ar: ' لم يتم تسجيل هذا المستخدم'
        },
        somethingWentWrong: {
            en: 'Something went wrong!',
            ar: 'حدث خطأ ما'
        },
        changedLanguageError: {
            en: 'Changed language wasn\'t save to database',
            ar: ' لم يتم حفظ تغيير اللغة إلى قاعدة البيانات '
        },
        canNotGetCategories: {
            en: 'Can not get Categories',
            ar: ' لا يمكن الحصول على الفئات'
        },
        canNotGet: {
            en: 'Can not get',
            ar: 'لا يمكن الحصول'
        },
        selectAssignee: {
            en: 'Please select assignee first',
            ar: ' يرجى تحديد المحال اليه أولا'
        },
        youHaveNoRights: {
            en: 'You have no rights to edit ',
            ar: ' لا يوجد لديك الحق في تعديل'
        },
        distributionFormIsEmpty: {
            en: 'Distribution form is empty.',
            ar: 'نموذج التوزيع فارغ'
        },
        selectPersonnel: {
            en: 'Select personnel',
            ar: 'يرجى تحديد الموظف'
        },
        forbiddenSelectPersonnelForIndividual: {
            en: 'You can\'t edit selected personnel for individual objective',
            ar: 'لا يمكن تعديل بيانات الموظف المحال الية فى الهدف الفردى'
        },
        successfullySaved: {
            en: 'Successfully saved',
            ar: 'تم الحفظ بنجاح'
        },
        ajaxPostError: {
            en: 'Ajax post error',
            ar: 'Ar Ajax post error'
        },
        onlyOneDocumentAttach: {
            en: 'Only one document can be attached',
            ar: ' يمكن إرفاق وثيقة واحدة فقط'
        },
        checkEmployeeFirst: {
            en: 'Check some employee first, please',
            ar: 'يرجى اختيار الموظف'
        },
        canNotSaveTemporaryEmployee: {
            en: 'Can\'t save temporary employee',
            ar: 'لا يمكن حفظ بيانات الموظف المؤقت'
        },
        fillAllInputFields: {
            en: 'Fill all input fields first, please',
            ar: 'يرجى ملء جميع مربعات النص'
        },
        somethingWrongWithTabs: {
            en: 'Something wrong with tabs',
            ar: 'حدث خطأ مع علامات التبويب '
        },
        canNotSaveMonthlyEvalOnServer: {
            en: 'Can\'t save monthly evaluation on the server!',
            ar: 'لا يمكن حفظ التقييم الشهري قاعدة البيانات!'
        },
        passwordWasSent: {
            en: 'Password was sent to user',
            ar: 'تم ارسال كلمة المرور الى المستخدم'
        },
        supervisorAssignedSuccess: {
            en: 'Supervisor was assigned successfully',
            ar: ' تم تعيين المشرف بنجاح '
        },
        noRightsToRate: {
            en: 'You have no rights to rate employee',
            ar: 'ليس مخول لتقييم الموظف'
        },
        timeToRateIsOver: {
            en: 'Time to rate employee is over',
            ar: 'الوقت المحدد لتقييم الموظف قد انتهى'
        },
        permissionToRateJulyJanuary: {
            en: 'You can rate employee for current period only on July and January',
            ar: ' يمكنك تقييم الموظف عن الفترة الحالية فقط في يوليو ويناير '
        },
        wrongEvaluationContentType: {
            en: 'Wrong evaluationView contentType is set',
            ar: ' تقييم عرض نوع المحتوى غير صحيح'
        },
        noRightsToRatePastPeriod: {
            en: 'You have no rights to rate employee for the past period',
            ar: 'ليس مخول لتقييم الموظف عن الفترة السابقة'
        },
        passMismatch: {
            en: 'Passwords mismatch',
            ar: 'عدم تطابق كلمة المرور'
        },
        passLengthErr: {
            en: 'Password must be longer than 3 characters',
            ar: ' يجب ان تحتوى كلمة المرور على اكثر من ثلاثة احرف'
        },
        passChangeSuccess: {
            en: 'Password was changed successfully',
            ar: 'تم تغيير كلمة المرور بنجاح'
        },
        configurationEmpty: {
            en: 'Configuration can not be empty',
            ar: 'لا يمكن ان يكون حقل الابعاد والتكوين فارغا '
        },
        configurationIsNotComplited: {
            en: 'Configuration is not completed',
            ar: 'عدم اكتمال ملءالابعاد والتكوين'
        },
        configurationElementRemoved: {
            en: 'Configuration elements were removed.',
            ar: 'تم حذف بيانات الابعاد والتكوين'
        },
        promotionTableIsEmpty: {
            en: 'Promotions items table is empty.',
            ar: 'جدول ترويج السلع لا يحتوى على بيانات'
        },
        fileSizeLimitReached: {
            en: 'File size limit reached',
            ar: ' تم بلوغ الحد الأقصى لحجم الملف'
        },
        readError: {
            en: 'Read error',
            ar: ' قراءة خطأ'
        },
        noData: {
            en: ' is already selected',
            ar: ' تم تحديده بالفعل'
        },
        renderYourPage: {
            en: 'Please, render your page, some information on there could be changed',
            ar: ' من فضلك، الاطلاع على  صفحتك، يمكنك تغيير بعض المعلومات '
        },
        youAreOnLeave: {
            en: 'You are on leave from now',
            ar: ' انت في إجازة من الآن'
        },
        invalidDate: {
            en: 'Invalid date',
            ar: 'التاريخ غير صالح'
        },
        linkSomeForm: {
            en: 'Please link some form',
            ar: 'يرجى ربط نموذج'
        },
        linkVisibilityForm: {
            en: 'Please link visibility form',
            ar: 'يرجى ربط نموذج الرؤية'
        },
        fillVisibilityForm: {
            en: 'Please fill visibility form',
            ar: 'يرجى ملء نموذج الرؤية'
        },
        noSubObjectives: {
            en: 'There are no sub-objectives created',
            ar: 'لم يتم انشاء اهداف فرعية'
        },
        wrongPassword: {
            en: 'Old password is wrong',
            ar: 'القديمة كلمة السر غير صحيحة'
        },
        selectCountryDD: {
            en: 'Please select a country',
            ar: 'يرجى اختيار البلد'
        },
        elementsWasDeleted: {
            en: 'elements was deleted',
            ar: 'تم حذف العناصر'
        },
        statusNotChanged : {
            en: 'Status not changed',
            ar: '' //todo
        },
        commentNotAdded : {
            en: 'Comment not added',
            ar: '' //todo
        }
    };

    if (typeof window === 'object' && this === window) {
        root = window;
    } else if (typeof global === 'object' && this === global) {
        root = global;
    } else {
        root = this;
    }

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = ERRORMESSAGES;
        }
    } else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return ERRORMESSAGES;
        });
    } else {
        root.ERRORMESSAGES = ERRORMESSAGES;
    }
}());

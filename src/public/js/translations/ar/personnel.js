var _ = require('underscore');
var paginationTranslation = require('./pagination');
var filtersTranslation = require('./filters');
var objectivesTranslation = require('./objectives');
var inStoreTasksTranslation = require('./inStoreTasks');

var personnelTranslation = {
    // top bar
    personnel                    : 'شؤون الموظفين',
    archive                      : 'الأرشيف',
    newPersonnel                 : 'موظف جديد',
    selectAll                    : 'اختيار الكل',
    action                       : 'اتخاذ إجراء',
    sendPassword                 : 'أرسال كلمة المرور',
    sendByEmail                  : 'أرسال بالبريد الإلكتروني',
    sendBySMS                    : 'أرسال برسالة نصية',
    disable                      : 'إلغاء تفعيل',
    unDisable                    : 'إعادة تفعيل',
    // list
    firstName                    : 'الاسم الأول',
    lastName                     : 'الاسم الاخير',
    position                     : 'المركز الوظيفي',
    email                        : 'البريد الإلكتروني',
    phone                        : 'الجوال',
    location                     : 'الموقع',
    createdBy                    : 'تم إنشاؤه بواسطة',
    status                       : 'الحالة',
    // create
    addNewEmployee               : 'إضافة موظف جديد',
    addPhoto                     : 'إضافة صورة',
    dateOfJoining                : ' تاريخ الالتحاق بالعمل',
    accessRole                   : 'نطاق الاستخدام',
    jobPosition                  : 'المركز الوظيفي',
    phoneNumber                  : 'الجوال',
    country                      : 'الدولة',
    region                       : 'المنطقة',
    subRegion                    : 'المنطقة الفرعية',
    retailSegment                : 'قطاع التجزئة',
    outlet                       : 'العميل',
    branch                       : 'الفرع',
    supervisor                   : 'المشرف',
    select                       : 'اختر',
    cropImages                   : 'تحديد الصورة',
    createBtn                    : 'إنشاء',
    // edit
    personnelProfile             : 'الملف الشخصي',
    changePhoto                  : 'تغيير الصورة',
    changePassword               : 'تغيير كلمة المرور',
    onLeave                      : 'في إجازة',
    cover                        : 'ينوب عن',
    // preview
    userProfile                  : 'البيانات الشخصية للموظف',
    main                         : ' الرئيسى',
    employeesEvaluation          : "تقييم الوظف",
    userPerformance              : 'أداء المستخدم',
    monthlyEvaluation            : 'التقييم الشهري',
    biYearlyEvaluation           : 'التقييم نصف سنوي',
    userTasks                    : 'مهام الموظف',
    editProfile                  : 'تعديل بيانات الملف الشخص',
    logout                       : 'تسجيل الخروج',
    findBtn                      : 'إيجاد',
    // evaluation
    averageRating                : 'متوسط التقييم',
    day                          : 'اليوم',
    days                         : 'الأيام',
    leftToRateEmployee           : 'المتبقية لتقييم الموظف',
    rateEmployee                 : 'تقييم الوظف',
    current                      : 'الحالية',
    month                        : 'شهر',
    rating                       : 'التقييم',
    notRated                     : 'بلا تقييم',
    timeToRateGone               : ' تم تجاوز الفترة المحددة لتقييم الموظف',
    previousRating               : 'التقييم السابق',
    time                         : 'الوقت',
    details                      : 'التفاصيل',
    viewDetails                  : 'عرض التفاصيل',
    rateNow                      : 'ابدأ التقييم',
    // change password
    changePassDescript           : ' يرجى اختيار كلمة مرور جديدة لحساب المستخدم هذا سوف يتم استبدال كلمة المرور القديمة بكلمة المرور الجديدة',
    oldPassword                  : 'كلمة المرور القديمة',
    newPassword                  : 'كلمة المرور الجديدة',
    confirmNewPassword           : 'تأكيد كلمة المرور الجديدة',
    // biYearly form
    biYearlyFormTitle            : ' النموذج الخاص بالتقييم النصف سنوي',
    professionalSkills           : 'المهارات المهنية',
    personalSkills               : 'المهارات الشخصية',
    summary                      : 'موجز',
    // list for selection
    setCover                     : 'تعيين إنابة',
    colleagues                   : 'الزملاء',
    temporaryEmployee            : 'موظف مؤقت',
    fullName                     : 'الاسم الكامل',
    assignTo                     : 'تعيين إلى',
    addSupervisor                : 'إضافة مشرف',
    //dialogs buttons
    okBtn                        : 'موافق',
    cancelBtn                    : 'إلغاء',
    saveBtn                      : 'حفظ',
    submitBtn                    : 'تقديم',
    nextBtn                      : 'التالي',
    backBtn                      : 'السابق',
    //biYearly evaluation form
    planningAndOrganizationSkills: ' مهارات التخطيط والتنظيم',
    prepareObj                   : ' إعداد الأهداف',
    preparePlan                  : 'إعداد الخطة اليومية والشهرية',
    followPlan                   : ' اتباع الخطة الموضوعة',
    sellingSkills                : 'مهارات البيع',
    stockCheck                   : 'فحص المخزون',
    orderCalc                    : 'العملية حسابية لطلب تجاري',
    sellFeatures                 : 'بيع الخصائص والمزايا',
    identifySign                 : 'التعرف على إشارات الشراء',
    closingTech                  : 'استخدام تقنية اغلاق الصفقة',
    sellingAids                  : 'استخدام الوصائل المساعدة للبيع',
    rotationAndCheck             : ' تنظيم (تدوير) المخزون وفحص انتهاء الصلاحية',
    distribution                 : 'التوزيع',
    followIssues                 : 'متابعة المسائل المعلقة',
    reporting                    : 'التقارير',
    marketFeed                   : 'الحصول علة ملاحظات السوق في الوقت المحدد',
    marketDev                    : 'تطوير السوق',
    businessOpp                  : 'خلق فرص جديدة للعمل',
    competAct                    : 'الأنشطة التنافسية',
    negSkill                     : 'مهارات التفاوض',
    objections                   : 'التعامل مع الاعتراضات',
    summaryOfPerformance         : 'ملخص الاداء',
    personnelSkills              : 'المهارات الشخصية',
    marketFeedSkills             : 'لدية قدرة التركيز على تحقيق نجاحات',
    marketDevSkills              : ' لدية قدر كبير من المهارة المستقلة الاستقلالية في العمل',
    businessOppSkills            : ' قادر على بناء العلاقات',
    persMot                      : 'لدية قدر كبير من التحفيظ الشخصي التحفيز الشخصي',
    investOr                     : 'إمكانية التوجيه والتحقيق',
    listStyle                    : 'الاستماع الفعال',
    selfTimeMan                  : 'الإدارة الذاتية وإدارة الوقت',
    energyLev                    : 'على مستوى عال من الطاقة (النشاط)',
    detailsAtt                   : 'المتابعة والاهتمام بالتفاصيل',
    problemSol                   : 'حل المشكلات واتخاذ القرارات',
    customerAw                   : 'العلاقات والوعى بالعملاء',
    teamWork                     : 'العمل الجماعي',
    cooperation                  : 'التعاون مع الأقسام الأخرى',
    communication                : 'مهارات التواصل الخطى والكتابي',
    computerSkills               : 'مهارات الحاسب الألى...',
    initiative                   : 'المبادرة',
    appearance                   : 'المظهر العام',
    attitude                     : 'السلوك',
    attendance                   : 'الحضور',
    commitment                   : 'الالتزام',
    overallPerformanceRating     : 'تقييم الأداء العام',
    exceptional                  : 'استثنائي',
    superior                     : 'متفوق',
    standard                     : 'متوسط المستوى',
    belowStandard                : 'دون المستوى المطلوب',
    newRating                    : 'جديد',
    objectives                   : 'الأهداف',
    standards                    : 'متوسط المستوى',
    ratingTitle                  : 'التقييم',
    editTitle                    : 'تعديل بيانات',
    // monthly evaluation form
    monthlyFormTitle             : 'نموذج التقييم الشهري',
    target                       : ' الهدف المحدد',
    achiev                       : ' النتائج المتحققة',
    age                          : 'العمر',
    individualObjectives         : 'الأهداف الفردية',
    companyObjectives            : 'اهداف الشركة',
    inStoreTasks                 : 'مهام البالغات في المتاجر',
    submittingReports            : 'تقديم التقارير',
    achievement                  : 'الانجازات',
    performance                  : 'الاداء',
    monthlyFormPreviewTitle      : 'معاينة نموذج التقييم الشهري',
    editBtn                      : 'تعديل',
    monthlyFormEditTitle         : 'تعديل نموذج التقييم الشهري',
    addTranslation               : {
        en: 'إضافة الترجمة العربية',
        ar: 'إضافة الترجمة الانجليزية'
    },
    goToBtn: 'الذهاب الى'
};

module.exports = _.extend({}, objectivesTranslation, inStoreTasksTranslation, filtersTranslation, personnelTranslation, paginationTranslation);

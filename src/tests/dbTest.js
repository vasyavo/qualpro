require('../config/development');
var CONSTANTS = require('../constants/mainConstants');
var request = require('supertest');
var expect = require('chai').expect;

var host = process.env.HOST;

var agent;

var testCountry1 = {
    name    : {
        en: 'United Arab Emirates',
        ar: 'الإمارات العربية المتحدة'
    },
    type    : 'country',
    currency: 'AED'
};

var testCountry2 = {
    name    : {
        en: 'Kuwait',
        ar: 'كويت'
    },
    type    : 'country',
    currency: 'KWD'
};

var testCountry3 = {
    name    : {
        en: 'Oman',
        ar: 'عمان'
    },
    type    : 'country',
    currency: 'OMR'
};

var testRegion1 = {name: {en: 'Abu Dhabi & Al Ain', ar: 'أبوضبي و العين'}, type: 'region'};
var testRegion2 = {name: {en: 'Kuwait', ar: 'كويت'}, type: 'region'};
var testRegion3 = {name: {en: 'Muscat', ar: 'مسقط'}, type: 'region'};

var testSubRegion1 = {name: {en: 'Abu Dhabi', ar: 'أبوضبي'}, type: 'subRegion'};
var testSubRegion2 = {name: {en: 'Al Ahmadi', ar: 'الأحمدي'}, type: 'subRegion'};
var testSubRegion3 = {name: {en: 'Al Amarat', ar: 'ال عمارات'}, type: 'subRegion'};

/*var testSubRegion4 = {name: {en: 'Uzhgorod', ar: 'أوزجورود'}, type: 'subRegion'};
 var testSubRegion5 = {name: {en: 'Mukachevo', ar: 'موكاتشيفو'}, type: 'subRegion'};
 var testSubRegion6 = {name: {en: 'Kyiv-SubRegion', ar: 'كييف-دون الإقليمية'}, type: 'subRegion'};*/

var testRetailSegment1 = {name: {en: 'Hypermarket', ar: 'هايبر ماركيت'}};
var testRetailSegment2 = {name: {en: 'A-class shops', ar: 'المحلات التجارية فئة-أ'}};
var testRetailSegment3 = {name: {en: 'B-class shops', ar: 'المحلات التجارية فئة-ب'}};
var testRetailSegment4 = {name: {en: 'C-class shops', ar: 'المحلات التجارية فئة-ت'}};
var testRetailSegment5 = {name: {en: 'Wholesale', ar: 'الجملة'}};
var testRetailSegment6 = {name: {en: 'Vans', ar: 'الشاحنات'}};

var testOutlet1 = {
    name          : {
        en: 'Carrefour',
        ar: 'كارفور'
    },
    subRegions    : [],
    retailSegments: []
};

var testOutlet2 = {
    name          : {
        en: 'Spinneys',
        ar: 'سبينيس'
    },
    subRegions    : [],
    retailSegments: []
};

var testOutlet3 = {
    name          : {
        en: 'Al Maya',
        ar: 'المايا'
    },
    subRegions    : [],
    retailSegments: []
};

var testOutlet4 = {
    name          : {
        en: 'Union COOP',
        ar: 'جمعية الإتحاد'
    },
    subRegions    : [],
    retailSegments: []
};

var testBranch1 = {
    name: {
        en       : 'Carrefour Marina Mall',
        ar       : 'كارفور مارينا مول'
    },
    address  : {
        en: 'Saadiyat island, exit 55, Marina Mall',
        ar: 'جزيرة السعديات ، مخرج 55 ، مارينا مول'
    },
    linkToMap: ''
};

var testBranch2 = {
    name     : {
        en: 'Carrefour Dalma Mall',
        ar: 'كارفور دلما مول'
    },
    address  : {
        en: 'Al Carrefour road, 35, Dalma mall',
        ar: 'شارع كارفور ، 35 ، مركز دلما'
    },
    linkToMap: ''
};

var testBranch3 = {
    name     : {
        en: 'Carrefour Airport road',
        ar: 'كارفورطريق المطار '
    },
    address  : {
        en: 'Airport road, exit 55',
        ar: 'طريق المطار ، مخرج 55'
    },
    linkToMap: ''
};

var testBranch4 = {
    name     : {
        en: 'Spinneys Yas Mall',
        ar: 'سبينيس ياس مول'
    },
    address  : {
        en: 'Sheikh Zayed road, Yas Mall',
        ar: 'شارع الشيخ زايد ، ياس مول'
    },
    linkToMap: ''
};

var testBranch5 = {
    name     : {
        en: 'Al Maya supermarket Yas island',
        ar: 'المايا جزيرة ياس سوبر ماركت'
    },
    address  : {
        en: 'Sheikh Zayed road, Yas Mall',
        ar: 'شارع الشيخ زايد ، ياس مول'
    },
    linkToMap: ''
};

var testBranch6 = {
    name     : {
        en: 'Union COOP Marina Mall',
        ar: 'جمعية الإتحاد مارينا مول '
    },
    address  : {
        en: 'Saadiyat island, exit 55, Marina Mall',
        ar: 'جزيرة السعديات ، مخرج 55 ، مارينا مول'
    },
    linkToMap: ''
};

var cache = require('./helpers/cache');

var adminObject = {
    login: 'admin@admin.com',
    pass : '121212',
    email        : 'admin@admin.com',
    firstName    : {
        en: 'Vasya',
        ar: 'نبيل'
    },
    lastName     : {
        en: 'Pupkin',
        ar: 'مدني'
    },
    archived     : false,
    position     : 0,
    accessRole   : 0,
    phoneNumber  : '971402032022',
    dateJoined   : new Date('1997-07-03'),
    description  : 'Automaticly created Super Admin',
    imageSrc     : 'data:image/jpeg;base64,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',
};

describe("Personnel test", function() {
    agent = request.agent(host);

    it("Create superAdmin " + adminObject.firstName.en + " " + adminObject.lastName.en, function (done) {
        agent
            .post('/personnel/createSuper')
            .send(adminObject)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                adminObject._id = resp.body;
                done();

            });
    });
});

describe("Locations test", function () {  // Runs once before all tests start.
    before("Get agent and login", function (done) {
        agent = request.agent(host);
        agent
            .post('/login')
            .send(adminObject)
            .expect(200, function (err, resp) {
                var body;
                if (err) {
                    return done(err);
                }

                body = resp.body;
                expect(body).to.be.instanceOf(Object);
                done();

            });

    });

    //region Countries

    it("Create country " + testCountry1.name.en, function (done) {
        agent
            .post('/country')
            .send(testCountry1)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testCountry1._id = resp.body._id;
                done();

            });
    });

    it("Create country " + testCountry2.name.en, function (done) {
        agent
            .post('/country')
            .send(testCountry2)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testCountry2._id = resp.body._id;
                done();

            });
    });

    it("Create country " + testCountry3.name.en, function (done) {
        agent
            .post('/country')
            .send(testCountry3)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testCountry3._id = resp.body._id;
                done();

            });
    });

    it('Get all countries', function (done) {
        agent
            .get('/country?contentType=country')
            .expect(200, function (err, resp) {
                if (err) {
                    return done(err);
                }

                var body = resp.body;
                var countries = body.data;
                var total = body.total;
                console.dir(countries);
                expect(total).to.be.equals(3);
                expect(countries).to.be.instanceOf(Array);

                done();
            });
    });

    //endregion

    //region Regions

    it('Create region ' + testRegion1.name.en + ' assigned to ' + testCountry1.name.en, function (done) {
        testRegion1.parent = testCountry1._id;
        agent
            .post('/region')
            .send(testRegion1)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testRegion1._id = resp.body._id;
                done();

            });
    });

    it('Create region ' + testRegion2.name.en + ' assigned to ' + testCountry2.name.en, function (done) {
        testRegion2.parent = testCountry2._id;
        agent
            .post('/region')
            .send(testRegion2)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testRegion2._id = resp.body._id;
                done();

            });
    });

    it('Create region ' + testRegion3.name.en + ' assigned to ' + testCountry3.name.en, function (done) {
        testRegion3.parent = testCountry3._id;
        agent
            .post('/region')
            .send(testRegion3)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testRegion3._id = resp.body._id;
                done();

            });
    });

    it('Get all regions by ' + testCountry1.name.en, function (done) {
        console.log(testCountry1._id);
        agent
            .get('/region/country/' + testCountry1._id)
            .expect(200, function (err, resp) {
                if (err) {
                    return done(err);
                }

                var body = resp.body;
                var regions = body.data;
                var total = body.total;

                expect(total).to.be.equals(1);
                expect(regions).to.be.instanceOf(Array);

                done();
            });
    });

    it('Get all regions by ' + testCountry2.name.en, function (done) {
        agent
            .get('/region/country/' + testCountry2._id)
            .expect(200, function (err, resp) {
                if (err) {
                    return done(err);
                }

                var body = resp.body;
                var regions = body.data;
                var total = body.total;

                expect(total).to.be.equals(1);
                expect(regions).to.be.instanceOf(Array);

                done();
            });
    });

    //endregion

    //region SubRegions

    it('Create subRegion ' + testSubRegion1.name.en + ' assigned to ' + testRegion1.name.en, function (done) {
        testSubRegion1.parent = testRegion1._id;
        agent
            .post('/subRegion')
            .send(testSubRegion1)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testOutlet1.subRegions.push(resp.body._id);
                testOutlet2.subRegions.push(resp.body._id);
                testOutlet3.subRegions.push(resp.body._id);
                testOutlet4.subRegions.push(resp.body._id);

                testBranch1.subRegion = resp.body._id;
                testBranch2.subRegion = resp.body._id;
                testBranch3.subRegion = resp.body._id;
                testBranch4.subRegion = resp.body._id;
                testBranch5.subRegion = resp.body._id;
                testBranch6.subRegion = resp.body._id;

                testSubRegion1._id = resp.body._id;
                done();

            });
    });

    it('Create subRegion ' + testSubRegion2.name.en + ' assigned to ' + testRegion2.name.en, function (done) {
        testSubRegion2.parent = testRegion2._id;
        agent
            .post('/subRegion')
            .send(testSubRegion2)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testOutlet1.subRegions.push(resp.body._id);
                testOutlet2.subRegions.push(resp.body._id);
                testOutlet4.subRegions.push(resp.body._id);

                testSubRegion2._id = resp.body._id;
                done();

            });
    });

    it('Create subRegion ' + testSubRegion3.name.en + ' assigned to ' + testRegion3.name.en, function (done) {
        testSubRegion3.parent = testRegion3._id;
        agent
            .post('/subRegion')
            .send(testSubRegion3)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testOutlet1.subRegions.push(resp.body._id);
                testOutlet2.subRegions.push(resp.body._id);
                testOutlet3.subRegions.push(resp.body._id);
                testOutlet4.subRegions.push(resp.body._id);

                testSubRegion3._id = resp.body._id;
                done();

            });
    });

    it('Get all subregions', function (done) {
        agent
            .get('/subRegion?contentType=subRegion')
            .expect(200, function (err, resp) {
                if (err) {
                    return done(err);
                }

                var body = resp.body;

                console.dir(body.data);
                expect(body.total).to.be.equals(3);
                expect(body.data).to.be.instanceOf(Array);

                done();
            });
    })

    it('Get all subregions by ' + testRegion1.name.en, function (done) {
        agent
            .get('/subRegion/region/' + testRegion1._id)
            .expect(200, function (err, resp) {
                if (err) {
                    return done(err);
                }

                var body = resp.body;

                expect(body.total).to.be.equals(1);
                expect(body.data).to.be.instanceOf(Array);

                done();
            })
    });

    it('Get all subregions by ' + testRegion2.name.en, function (done) {
        agent
            .get('/subRegion/region/' + testRegion2._id)
            .expect(200, function (err, resp) {
                if (err) {
                    return done(err);
                }

                var body = resp.body;

                expect(body.total).to.be.equals(1);
                expect(body.data).to.be.instanceOf(Array);

                done();
            });
    });

    //endregion

    //region RetailSegments

    it("Create retailSegment " + testRetailSegment1.name.en, function (done) {
        agent
            .post('/retailSegment')
            .send(testRetailSegment1)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testOutlet1.retailSegments.push(resp.body._id);
                testOutlet2.retailSegments.push(resp.body._id);
                testOutlet3.retailSegments.push(resp.body._id);
                testOutlet4.retailSegments.push(resp.body._id);

                testBranch1.retailSegment = resp.body._id;
                testBranch4.retailSegment = resp.body._id;
                testBranch6.retailSegment = resp.body._id;

                testRetailSegment1._id = resp.body._id;
                done();

            });
    });

    it("Create retailSegment " + testRetailSegment2.name.en, function (done) {
        agent
            .post('/retailSegment')
            .send(testRetailSegment2)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testOutlet1.retailSegments.push(resp.body._id);
                testOutlet2.retailSegments.push(resp.body._id);
                testOutlet3.retailSegments.push(resp.body._id);
                testOutlet4.retailSegments.push(resp.body._id);

                testBranch2.retailSegment = resp.body._id;

                testRetailSegment2._id = resp.body._id;
                done();

            });
    });

    it("Create retailSegment " + testRetailSegment3.name.en, function (done) {
        agent
            .post('/retailSegment')
            .send(testRetailSegment3)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testOutlet1.retailSegments.push(resp.body._id);
                testOutlet2.retailSegments.push(resp.body._id);
                testOutlet3.retailSegments.push(resp.body._id);
                testOutlet4.retailSegments.push(resp.body._id);

                testBranch3.retailSegment = resp.body._id;
                testBranch5.retailSegment = resp.body._id;

                testRetailSegment3._id = resp.body._id;
                done();

            });
    });

    it("Create retailSegment " + testRetailSegment4.name.en, function (done) {
        agent
            .post('/retailSegment')
            .send(testRetailSegment4)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testRetailSegment4._id = resp.body._id;
                done();

            });
    });

    it("Create retailSegment " + testRetailSegment5.name.en, function (done) {
        agent
            .post('/retailSegment')
            .send(testRetailSegment5)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testRetailSegment5._id = resp.body._id;
                done();

            });
    });

    it("Create retailSegment " + testRetailSegment6.name.en, function (done) {
        agent
            .post('/retailSegment')
            .send(testRetailSegment6)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testRetailSegment6._id = resp.body._id;
                done();

            });
    });

    it('Get all Trade channels', function (done) {
        agent
            .get('/retailSegment')
            .expect(200, function (err, resp) {
                if (err) {
                    return done(err);
                }

                var body = resp.body;
                var retailSegments = body.data;
                var total = body.total;

                expect(total).to.be.equals(6);
                expect(retailSegments).to.be.instanceOf(Array);

                done();
            })
    });

    //endregion

    //region Outlets

    it("Create outlet " + testOutlet1.name.en, function (done) {
        agent
            .post('/outlet')
            .send(testOutlet1)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBranch1.outlet = resp.body._id;
                testBranch2.outlet = resp.body._id;
                testBranch3.outlet = resp.body._id;
                testBranch6.outlet = resp.body._id;

                testOutlet1._id = resp.body._id;
                done();

            });
    });

    it("Create outlet " + testOutlet2.name.en, function (done) {
        agent
            .post('/outlet')
            .send(testOutlet2)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBranch4.outlet = resp.body._id;

                testOutlet2._id = resp.body._id;
                done();

            });
    });

    it("Create outlet " + testOutlet3.name.en, function (done) {
        agent
            .post('/outlet')
            .send(testOutlet3)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBranch5.outlet = resp.body._id;

                testOutlet3._id = resp.body._id;
                done();

            });
    });

    it("Create outlet " + testOutlet4.name.en, function (done) {
        agent
            .post('/outlet')
            .send(testOutlet4)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testOutlet4._id = resp.body._id;
                done();

            });
    });

    it('Get all outlets', function (done) {
        agent
            .get('/outlet')
            .expect(200, function (err, resp) {
                if (err) {
                    return done(err);
                }

                var body = resp.body;
                var outlets = body.data;
                var total = body.total;

                expect(total).to.be.equals(4);
                expect(outlets).to.be.instanceOf(Array);

                done();
            });
    });

    //endregion

    //region Branches

    it("Create branch " + testBranch1.name.en, function (done) {
        agent
            .post('/branch')
            .send(testBranch1)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBranch1._id = resp.body._id;
                done();

            });
    });

    it("Create branch " + testBranch2.name.en, function (done) {
        agent
            .post('/branch')
            .send(testBranch2)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBranch2._id = resp.body._id;
                done();

            });
    });

    it("Create branch " + testBranch3.name.en, function (done) {
        agent
            .post('/branch')
            .send(testBranch3)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBranch3._id = resp.body._id;
                done();

            });
    });

    it("Create branch " + testBranch4.name.en, function (done) {
        agent
            .post('/branch')
            .send(testBranch4)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBranch4._id = resp.body._id;
                done();

            });
    });

    it("Create branch " + testBranch5.name.en, function (done) {
        agent
            .post('/branch')
            .send(testBranch5)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBranch5._id = resp.body._id;
                done();

            });
    });

    it("Create branch " + testBranch6.name.en, function (done) {
        agent
            .post('/branch')
            .send(testBranch6)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBranch6._id = resp.body._id;
                done();

            });
    });


    it('Get all branches', function (done) {
        agent
            .get('/branch')
            .expect(200, function (err, resp) {
                if (err) {
                    return done(err);
                }

                var body = resp.body;
                var branches = body.data;
                var total = body.total;

                expect(total).to.be.equals(6);
                expect(branches).to.be.instanceOf(Array);

                done();
            });
    });

    //endregion

});

describe("Personnel test", function() {
    agent = request.agent(host);

    it("Update superAdmin " + adminObject.firstName.en + " " + adminObject.lastName.en, function (done) {
        var updateObject = {
            country: [testCountry1._id, testCountry2._id, testCountry3._id],
            outlet: [testOutlet1._id, testOutlet2._id, testOutlet3._id, testOutlet4._id],
            retailSegment: [testRetailSegment1._id, testRetailSegment2._id, testRetailSegment3._id],
            region: [testRegion1._id],
            subRegion: [testSubRegion1._id]
        };

        agent
            .patch('/personnel/' + adminObject._id)
            .send(updateObject)
            .expect(200, function (err, resp) {
                if (err) {
                    return done(err);
                }

                done();
            });
    });
});


require('../config/development');

var request = require('supertest');
var expect = require('chai').expect;

var host = process.env.HOST;

var agent;

var testBrand1 = {
    name: {
        en: 'Coca Cola',
        ar: 'كوكا كولا'
    }
};

var testBrand2 = {
    name: {
        en: 'SNIKERS'
    }
};

var testBrand3 = {
    name: {
        en: 'Pepsi',
        ar: 'بيبسي'
    }
};

var adminObject = {
    login: 'admin@admin.com',
    pass : '121212'
};

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

    //region Brands

    it("Create brand " + testBrand1.name.en, function (done) {
        agent
            .post('/brand')
            .send(testBrand1)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBrand1._id = resp.body._id;
                done();

            });
    });

    it("Create brand " + testBrand2.name.en, function (done) {
        agent
            .post('/brand')
            .send(testBrand2)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBrand2._id = resp.body._id;
                done();

            });
    });

    it("Create brand " + testBrand3.name.en, function (done) {
        agent
            .post('/brand')
            .send(testBrand3)
            .expect(201, function (err, resp) {
                if (err) {
                    return done(err);
                }

                testBrand3._id = resp.body._id;
                done();

            });
    });

    //endregion
});

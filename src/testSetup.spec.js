const chai = require('chai');
const async = require('async');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const mongo = require('./utils/mongo');

beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
});

before(function(done) {
    chai.use(sinonChai);

    sinon.stub.returnsWithResolve = function(data) {
        return this.returns(Promise.resolve(data));
    };
    sinon.stub.returnsWithReject = function(err) {
        return this.returns(Promise.reject(err));
    };

    mongo.on('open', () => {
        mongo.db.dropDatabase(done);
    });
});

afterEach(function() {
    this.sandbox.restore();
});
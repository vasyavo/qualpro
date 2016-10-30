const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
});

before(() => {
    chai.use(sinonChai);

    sinon.stub.returnsWithResolve = function(data) {
        return this.returns(Promise.resolve(data));
    };
    sinon.stub.returnsWithReject = function(err) {
        return this.returns(Promise.reject(err));
    };
});

afterEach(function() {
    this.sandbox.restore();
});

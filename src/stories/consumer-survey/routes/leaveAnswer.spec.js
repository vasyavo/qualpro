const _ = require('lodash');
const expect = require('chai').expect;
const async = require('async');
const mongoose = require('mongoose');
const ObjectId = require('bson-objectid');
const request = require('supertest-as-promised');
const server = require('./../../../server');
const faker = require('faker');
const logger = require('./../../../utils/logger');

const {
    domainCountrySample,
    domainRegionSample,
    domainSubRegionSample,
    retailSegmentSample,
    outletSample,
    branchSample,
    whatsYourAgeQuestion,
    didYouLikeOurServiceQuestion,
    surveySample,
    answersSample
} = require('./mockData');
const AnswerModel = require('./../types/answer/model');

const Authenticator = require('./../../../authenticator');

describe('leave answer', () => {

    it('should works', function * () {
        const resp = yield Authenticator.master
            .post('/consumer-survey/answer')
            .send(answersSample)
            .expect(200);

        const body = resp.body;

        expect(body).to.be.an('Object');

        const answers = yield AnswerModel.find({
            surveyId: surveySample._id,
            questionId: {
                $in: [
                    whatsYourAgeQuestion._id,
                    didYouLikeOurServiceQuestion._id
                ]
            }
        })
            .lean()
            .exec();

        expect(answers).to.be.an('Array')
            .and.have.lengthOf(2);

        _.forOwn(answers, (answer) => {
            expect(answer).to.be.an('Object')
                .and.include.all.keys([
                    'surveyId', 'questionId', 'personnelId',
                    'country', 'region', 'subRegion', 'retailSegment', 'outlet', 'branch'
                ]);
            expect(answer).to.have.property('customer')
                .and.be.eql(answersSample.customer);
            expect(answer).to.have.property('optionIndex')
                .and.be.an('Array')
                .and.have.lengthOf(1);
            expect(_.first(answer.optionIndex)).to.be.a('Number');
        });
    });

});

const ObjectId = require('bson-objectid');

const domainCountrySample = {
    _id: `${ObjectId()}`,
    name: {
        en: 'UNITED ARAB EMIRATES',
    },
    type: 'country',
};
const domainRegionSample = {
    _id: `${ObjectId()}`,
    name: {
        en: 'DUBAI',
    },
    type: 'region',
    parent: domainCountrySample._id,
};
const domainSubRegionSample = {
    _id: `${ObjectId()}`,
    name: {
        en: 'DUBAI',
    },
    type: 'subRegion',
    parent: domainRegionSample._id,
};
const retailSegmentSample = {
    _id: `${ObjectId()}`,
    name: {
        en: 'Segment C',
    },
    subRegions: [domainSubRegionSample._id],
};
const outletSample = {
    _id: `${ObjectId()}`,
    name: {
        en: 'Kefir',
    },
    subRegions: [domainSubRegionSample._id],
    retailSegments: [retailSegmentSample._id],
};
const branchSample = {
    _id: `${ObjectId()}`,
    name: {
        en: 'Kefir 0-24',
    },
    address: {
        en: 'Uzhhorod, Svobody Ave 40'
    },
    subRegion: domainSubRegionSample._id,
    retailSegment: retailSegmentSample._id,
    outlet: outletSample._id,
};

const whatsYourAgeQuestion = {
    _id: `${ObjectId()}`,
    title: {
        en: `What's your age?`
    },
    type: 'singleChoice',
    options: [
        { en: '18-24' },
        { en: '24-30' },
        { en: '30-36' },
    ]
};
const didYouLikeOurServiceQuestion = {
    _id: `${ObjectId()}`,
    title: {
        en: 'Did you like our service?',
    },
    type: 'nps',
    options: [
        { en: 1 },
        { en: 2 },
        { en: 3 },
        { en: 4 },
        { en: 5 },
    ]
};

const surveySample = {
    _id: `${ObjectId()}`,
    title: {
        en: 'test survey',
    },
    dueDate: Date.now(),
    status: 'draft',
    location: {
        en: `${domainCountrySample.name.en} > ${domainRegionSample.name.en} > ${domainSubRegionSample.name.en}`,
    },
    country: [domainCountrySample._id],
    region: [domainRegionSample._id],
    subRegion: [domainSubRegionSample._id],
    retailSegment: [retailSegmentSample._id],
    outlet: [outletSample._id],
    branch: [branchSample._id],
    questions: [whatsYourAgeQuestion, didYouLikeOurServiceQuestion]
};

const answersSample = {
    _id: `${ObjectId()}`,
    surveyId: surveySample._id,
    answers: [{
        questionId: whatsYourAgeQuestion._id,
        optionIndex: [1]
    }, {
        questionId: didYouLikeOurServiceQuestion._id,
        optionIndex: [2]
    }],
    customer: {
        name: 'John Doe',
        nationality: 'ukrainian',
        gender: 'male'
    },
    country: [domainCountrySample._id],
    region: [domainRegionSample._id],
    subRegion: [domainSubRegionSample._id],
    retailSegment: [retailSegmentSample._id],
    outlet: [outletSample._id],
    branch: [branchSample._id]
};

module.exports = {
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
};

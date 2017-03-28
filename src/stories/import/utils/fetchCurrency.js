const CurrencyModel = require('./../../../types/currency/model');

module.exports = (callback) => {
    CurrencyModel.find({}).select('_id name').lean().exec(callback);
};

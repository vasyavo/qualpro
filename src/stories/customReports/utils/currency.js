const DomainModel = require('../../../types/domain/model');
const currencyApi = require('currency-api').api;
const logger = require('../../../utils/logger');

const defaultData = [];

const getCurrency = () => {
    const listOfCurrencies = [...new Set(defaultData.map((item) => {
        return item.currency;
    }))];
    for (const currency of listOfCurrencies) {
        currencyApi.getExchangeRate({
            currency,
        }, (err, response) => {
            if (err) {
                logger.error(err);
            }
            if (response) {
                defaultData.map((country) => {
                    if (country.currency === currency) {
                        country.currencyInUsd = response;
                    }
                    return country;
                });
            }
        });
    }
};

DomainModel.aggregate(
    [
        {
            $match: {
                type: 'country',
            },
        },
        {
            $project: {
                currency: 1,
            },
        },
    ]
).exec().then((data) => {
    defaultData.push(...data);
    getCurrency();
});

module.exports = {
    getCurrency,
    defaultData,
};

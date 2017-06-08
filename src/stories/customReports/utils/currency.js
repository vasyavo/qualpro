const DomainModel = require('../../../types/domain/model');
const request = require('./request');
const API_KEY = require('../../../config').currencyLayer;

const defaultData = [];

const getCurrency = () => {
    const listOfCurrencies = [...new Set(defaultData.map((item) => {
        return item.currency;
    }))];
    for (const currency of listOfCurrencies) {
        const url = `${API_KEY.host}?access_key=${API_KEY.api}&currencies=${currency}`;
        request({
            method: 'GET',
            url,
        }, (err, response) => {
            if (response) {
                response = JSON.parse(response);
                defaultData.map((country) => {
                    if (country.currency === currency) {
                        country.currencyInUsd = response.quotes[`USD${currency}`];
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

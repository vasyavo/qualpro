module.exports = (req, res, next) => {
    res.status(200).send({ test: 'get all' });
};

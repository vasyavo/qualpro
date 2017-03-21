const FileHandler = require('./../../../handlers/file');

const fileHandler = new FileHandler();

module.exports = (req, res) => {
    const imageName = req.params.imageName;
    const url = fileHandler.computeUrl(imageName);

    res.status(200).send(url);
};

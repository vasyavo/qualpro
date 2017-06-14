const Html5Entities = require('html-entities').Html5Entities;
const XmlEntities = require('html-entities').XmlEntities;
const sanitizeHtml = require('sanitize-html');

const defaultOptions = {
    allowedTags: [],
    allowedAttributes: [],
};

module.exports = (html, options = defaultOptions) => {
    return sanitizeHtml(XmlEntities.decode(Html5Entities.decode(html)), options);
};

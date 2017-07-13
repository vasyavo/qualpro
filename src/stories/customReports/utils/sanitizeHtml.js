const Html5Entities = require('html-entities').Html5Entities;
const XmlEntities = require('html-entities').XmlEntities;
const sanitizeHtml = require('sanitize-html');
const _ = require('lodash');
const emojiStrip = require('emoji-strip');

const defaultOptions = {
    allowedTags: [],
    allowedAttributes: [],
};

module.exports = (html, options = defaultOptions) => {
    return _.unescape(sanitizeHtml(XmlEntities.decode(Html5Entities.decode(emojiStrip(html))), options));
};

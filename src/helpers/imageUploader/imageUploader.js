var imageUploader = function (config) {
    'use strict';
    var imageUploadImpl;

    if (!config || !config.type) {
        config = {
            type     : 'FileSystem',
            directory: 'public'
        };

        imageUploadImpl = require('./imageFileSystem')(config.directory);
    } else {
        if (!config.awsConfig) {
            console.warn('method expects aws config object\n'
                + 'with fields: "accessKeyId", "secretAccessKey", "imageUrlDurationSec"\n');
            return null;
        }
        imageUploadImpl = require('./imageAmazonS3')(config.awsConfig);
    }

    return {
        uploadFromFile  : imageUploadImpl.uploadFromFile,
        uploadFromBuffer: imageUploadImpl.uploadFile,
        uploadFile      : imageUploadImpl.uploadFile,
        uploadImage     : imageUploadImpl.uploadImage,
        duplicateImage  : imageUploadImpl.duplicateImage,
        removeImage     : imageUploadImpl.removeImage,
        getImageUrl     : imageUploadImpl.getImageUrl
    };
};

module.exports = imageUploader;
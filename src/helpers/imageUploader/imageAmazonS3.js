var imageUploader = function (awsConfig) {
    "use strict";

    var AWS = require('aws-sdk');

    AWS.config.update({
        region: awsConfig.region,
        accessKeyId        : awsConfig.accessKeyId,
        secretAccessKey    : awsConfig.secretAccessKey
    });

    var amazonS3 = awsConfig;
    var s3 = new AWS.S3({httpOptions: {timeout: 50000}});
    var defaultACL = 'authenticated-read';
    var s3policy = require('s3policy');

    function encodeFromBase64(dataString, callback) {
        if (!dataString) {
            callback({error: 'Invalid input string'});
            return;
        }

        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        var imageData = {};

        if (!matches || matches.length !== 3) {
            try {
                imageData.type = 'image/png';
                imageData.data = new Buffer(dataString, 'base64');
                imageData.extension = 'png';
            } catch (err) {
                callback({error: 'Invalid input string'});
                return;
            }
        } else {
            imageData.type = matches[1];
            imageData.data = new Buffer(matches[2], 'base64');

            var imageTypeRegularExpression = /\/(.*?)$/;
            var imageTypeDetected = imageData
                .type
                .match(imageTypeRegularExpression);

            imageData.extension = imageTypeDetected[1];
        }

        callback(null, imageData);
    }

    function uploadImage(imageData, imageName, folder, callback) {
        encodeFromBase64(imageData, function (err, imageData) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
                return;
            }
            var imageNameWithExt = imageName + '.' + imageData.extension;
            var key = folder + '/' + imageNameWithExt;
            putObjectToAWS(awsConfig.bucketName, key, imageData.data, function (err, imageUrl) {
                if (callback && (typeof callback === 'function')) {
                    callback(err, imageNameWithExt);
                }
            });
        });
    };

    function uploadFile(fileData, folder, callback) {
        var imageNameWithExt = fileData.name + '.' + fileData.extension;

        folder = awsConfig.bucketName;

        putObjectToAWS(folder, imageNameWithExt, fileData.data, fileData.type, function (err, imageUrl) {
            if (callback && (typeof callback === 'function')) {
                callback(err, imageNameWithExt);
            }
        });
    };

    function putObjectToAWS(bucket, key, body, contentType, callback) {
        s3.putObject({
            Bucket     : bucket,
            Key        : key,
            Body       : body,
            ACL        : defaultACL,
            ContentType: contentType
        }, function (err, data) {
            if (callback && (typeof callback === 'function')) {
                callback(err, data);
            }
        });
    }

    function removeImage(imageName, folder, callback)  {

        //var key = folder + '/' + imageName;

        removeObjectFromAWS(folder + '/' + imageName, imageName, function (err, imageUrl) {
            if (callback && (typeof callback === 'function')) {
                callback(err, imageUrl);
            }
        });
    }

    function removeObjectFromAWS(bucket, name, callback) {
        var params = {
            Bucket: bucket,
            Key: name
        };
        s3.deleteObject(params, function (err, data) {
            if (callback && typeof callback === 'function') {
                callback(err, data);
            }
        });
    };

    function getImageUrl(name, folder) {
        return getObjectUrlFromAmazon(name, folder);
    };

    function getObjectUrlFromAmazon(name, bucket) {
        var operation = 'getObject';
        var options = {
            Bucket: awsConfig.bucketName,
            //Bucket: bucket,
            Key: name,
            Expires: 60 * 60 * 24
        };

        return s3.getSignedUrl(operation, options);
    }

    /*function getObjectUrlFromAmazon(name, folder) {
        //var myS3Account = new s3policy(amazonS3.accessKeyId, amazonS3.secretAccessKey);
        var key = folder + '/' + name;
        return readPolicy(key, awsConfig.bucketName, amazonS3.imageUrlDurationSec);
    };

    //use custome read policy generator
    function readPolicy (key, bucket, duration) {
        var dateObj = new Date;
        var expiration = new Date(dateObj.getTime() + duration * 1000);
        expiration = Math.round(expiration.getTime() / 1000);

        var policy = 'GET\n\n\n' + expiration + '\n';
        policy += '/' + bucket + '/' + key;

        var signature = crypto.createHmac("sha1", amazonS3.secretAccessKey).update(policy);

        var regionDomName = amazonS3.region ? 's3-' + amazonS3.region : 's3';

        var url = 'https://' + regionDomName + '.amazonaws.com/';
        url += bucket + '/';
        url += key;
        url += '?AWSAccessKeyId=' + amazonS3.accessKeyId;
        url += '&Expires=' + expiration;
        url += '&Signature=' + encodeURIComponent(signature.digest("base64"));

        return url;
    };*/

    function duplicateImage(url, imageName, folderName, callback) {

        var imageData = {};

        url = url.substring(0, (url.indexOf("#") == -1) ? url.length : url.indexOf("#"));
        url = url.substring(0, (url.indexOf("?") == -1) ? url.length : url.indexOf("?"));

        imageData.extension = url.substring(url.lastIndexOf('.') + 1);
        imageData.name = imageName;
        var oldImageFullName = url.substring(url.lastIndexOf('/') + 1);

        var fileKey = folderName + '/' + oldImageFullName;
        var getFileParams = {
            Bucket: awsConfig.bucketName,
            Key: fileKey
        };

        s3.getObject(getFileParams, function (err, data) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
                return;
            }

            var imageNameWithExt = imageName + '.' + imageData.extension;
            var key = folderName + '/' + imageNameWithExt;

            putObjectToAWS(awsConfig.bucketName, key, data.Body, function (err, imageUrl) {
                if (callback && (typeof callback === 'function')) {
                    callback(err, imageNameWithExt);
                }
            });
        });
    }

    return {
        uploadFile: uploadFile,
        uploadImage: uploadImage,
        duplicateImage: duplicateImage,
        removeImage: removeImage,
        getImageUrl: getImageUrl
    };
};

module.exports = imageUploader;
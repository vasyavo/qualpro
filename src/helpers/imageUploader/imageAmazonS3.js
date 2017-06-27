const fs = require('fs');
const AWS = require('aws-sdk');

var imageUploader = function (awsConfig) {
    AWS.config.update({
        region: awsConfig.region,
        accessKeyId        : awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey
    });

    const s3 = new AWS.S3({
        httpOptions: {
            timeout: 50000,
        },
    });
    const defaultACL = 'authenticated-read';

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

    function uploadFromBase64(imageData, imageName, callback) {
        encodeFromBase64(imageData, function (err, imageData) {
            if (err) {
                if (callback && (typeof callback === 'function')) {
                    callback(err);
                }
                return;
            }
            const imageNameWithExt = `${imageName}.${imageData.extension}`;

            putObjectToAWS(awsConfig.bucketName, imageNameWithExt, imageData.data, imageData.type, function (err, imageUrl) {
                if (callback && (typeof callback === 'function')) {
                    callback(err, imageNameWithExt);
                }
            });
        });
    };

    function uploadFromFile(fileData, bucket, callback) {
        const bucketName = awsConfig.bucketName;
        const fileName = `${fileData.name}.${fileData.extension}`;

        const readStream = fs.createReadStream(fileData.tempPath);

        readStream.on('error', (err) => {
            if (err) {
                return callback(err);
            }
        });

        readStream.on('open', () => {
            putObjectToAWS(bucketName, fileName, readStream, fileData.type, (err, imageUrl) => {
                if (callback && (typeof callback === 'function')) {
                    callback(err, fileName);
                }
            });
        });
    }

    function uploadFile(fileData, bucket, callback) {
        const bucketName = awsConfig.bucketName;
        const fileName = `${fileData.name}.${fileData.extension}`;

        putObjectToAWS(bucketName, fileName, fileData.data, fileData.type, (err) => {
            if (callback && (typeof callback === 'function')) {
                callback(err, fileName);
            }
        });
    }

    function putObjectToAWS(bucket, key, body, contentType, callback) {
        s3.putObject({
            Bucket: bucket,
            Key: `files/${key}`,
            Body: body,
            ACL: defaultACL,
            ContentType: contentType,
        }, (err, data) => {
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
            Bucket: awsConfig.bucketName,
            Key   : name
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
            Key: `files/${name}`,
            Expires: 60 * 60 * 24,
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

    function getFile (fileName, bucket) {
        return new Promise((resolve, reject) => {
            const s3Params = {
                Bucket: awsConfig.bucketName,
                Key: `files/${fileName}`,
            };
            s3.getObject(s3Params, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    }
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
        uploadFile    : uploadFile,
        uploadFromFile: uploadFromFile,
        uploadImage   : uploadImage,
        duplicateImage: duplicateImage,
        removeImage: removeImage,
        getImageUrl: getImageUrl,
        uploadFromBase64 : uploadFromBase64,
        getFile
    };
};

module.exports = imageUploader;
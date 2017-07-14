var _ = require('underscore');
var $ = require('jQuery');
var dataService = require('./dataService');
var CONSTANTS = require('./constants/otherConstants');
var ERROR_MESSAGES = require('./constants/errorMessages');
var canvasSize = CONSTANTS.CANVAS_SIZE;
var App = require('./appState');

var canvasDrawing = function (options, context) {
    var canvas = (options.canvas) ? options.canvas : context.$('.avatar canvas')[0];

    var model = (options.model) ? options.model : {};
    var img = new Image();

    img.onload = function () {
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
    };

    img.src = _.templateHelpers.isPreview(model.imageSrc);
    context.imageSrc = model.imageSrc;
};

var canvasDraw = function (options, _context) {
    var model = (options && options.model) ? options.model : null;
    var context = (_context) ? _context : this;
    var canvas = context.$('.avatar canvas')[0];
    var inputFile = context.$('#inputImg');
    var translation = options.translation;
    var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';

    inputFile.prop('accept', 'image/*');
    inputFile.on('change', function (e) {
        e.preventDefault();

        var file = inputFile[0].files[0];
        var filesExt = ['jpg', 'gif', 'png', 'jpe', 'jfif', 'jpeg', 'bmp', 'JPEG', 'JPG', 'GIF', 'PNG', 'BMP'];//fix type file
        var parts = $(inputFile).val().split('.');//fix type file
        var fr;

        if (filesExt.join().search(parts[parts.length - 1]) !== -1) {
            fr = new FileReader();

            fr.onload = function () {
                var src = fr.result;

                $('.image_input').html(['<img src="', src, '"/>'].join(''));
                $('.image_input img').Jcrop({
                    bgColor    : 'white',
                    bgOpacity  : .6,
                    setSelect  : [0, 0, 200, 200],
                    aspectRatio: 1,
                    onSelect   : imgSelect,
                    onChange   : imgSelect,
                    boxWidth   : 400,
                    boxHeight  : 400,
                    minSize    : [10, 10]
                });

                function imgSelect(sellictions) {
                    var ctx;
                    var img;
                    var canvasCrop;

                    if (parseInt(sellictions.w) > 0) {
                        img = $('.image_input img')[0];
                        canvasCrop = document.createElement('canvas');
                        canvasCrop.height = canvasSize;
                        canvasCrop.width = canvasSize;
                        ctx = canvasCrop.getContext('2d');
                        ctx.drawImage(img, sellictions.x, sellictions.y, sellictions.w, sellictions.h, 0, 0, canvasCrop.width, canvasCrop.height);
                        $('.image_output').attr('src', canvasCrop.toDataURL('image/' + parts[1]));
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                }

                $('.cropImages').dialog({
                    dialogClass  : 'crop-images-dialog',
                    closeOnEscape: false,
                    autoOpen     : true,
                    resizable    : true,
                    title        : 'Crop Images',
                    width        : '900',
                    showCancelBtn: false,
                    buttons      : {
                        cancel : {
                            text : (translation && translation.cancelBtn) ? translation.cancelBtn : 'Cancel',
                            class: 'btn cancelBtn',
                            click: function () {
                                $(this).dialog('close').dialog('destroy');
                            }
                        }, save: {
                            text : (translation && translation.cropBtn) ? translation.cropBtn : 'Crop',
                            class: 'btn',

                            click: function () {
                                var imageSrcCrop = $('.image_output').attr('src');

                                if (model) {
                                    model.imageSrc = imageSrcCrop;
                                } else {
                                    model = {
                                        imageSrc: imageSrcCrop
                                    }
                                }
                                canvasDrawing({model: model, canvas: canvas}, context);
                                $(this).dialog('close').dialog('destroy');
                            }
                        }
                    }

                });

            };
            inputFile.val('');

            fr.readAsDataURL(file);

        } else {
            App.render({type: 'error', message: ERROR_MESSAGES.forbiddenTypeOfFile[currentLanguage]});
        }
    });
    canvasDrawing({model: model}, context);
};

module.exports = {
    canvasDrawing: canvasDrawing,
    canvasDraw   : canvasDraw
};

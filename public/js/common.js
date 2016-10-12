define([
    'jQuery',
    'dataService',
    'constants/otherConstants',
    'constants/errorMessages'
], function ($, dataService, CONSTANTS, ERROR_MESSAGES) {
    var canvasSize = CONSTANTS.CANVAS_SIZE;

    var canvasDrawing = function (options, context) {
        var canvas = (options.canvas) ? options.canvas : context.$('.avatar canvas')[0];

        var model = (options.model) ? options.model : {
            imageSrc: "data:image/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAAAAACPAi4CAAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAABAAAAAQADq8/hgAAAEaElEQVRYw82X6XLbNhCA+f4PVomk5MRyHDtp63oEgDcl3vfRBQhQIEVKSvsnO+OxRBEfFnthV+n/pyi/NaCryzzL8rJu/wOgzQPXJBgjhDExnXPW/Aqgy30DI0yIwYQQ4Bhe2j0I6BIbI1jL9meC2TdkRu0jgMxCGN5H2HT8IIzjKPAdE9NngEjuAhqfv3rOpe3aIrDAFoB1qtuA3ADlMXKuz9vlLqZokt4CxPAOQXa2bPDCRVSJYB0QIDA4ibp+TVKDbuCvAeh6YpX9DWkcUGJCkAARXW9UfXeL0PmUcF4CZBA4cALv5nqQM+yD4mtATQMOGMi9RzghiKriCuBiAzsB1e8uwUUGtroZIAEsqfqHCI2JjdGZHNDSZzHYb0boQK4JOTVXNQFEoJXDPskEvrYTrJHgIwOdZEBrggXzfkbo+sY7Hp0Fx9bUYbUEAAtgV/waHAcCnOew3arbLy5lVXGSXIrKGQkrKKMLcnHsPjEGAla1PYi+/YCV37e7DRp1qUDjwREK1wjbo56hezRoPLxt9lzUg+m96Hvtz3BMcU9syQAxKBSJ/c2Nqv0Em5C/97q+BdGoEuoORN98CkAqzsAAPh690vdv2tOOEcx/dodP0zq+qjpoQQF7/Vno2UA0OgLQQbUZI6t/1+BlRgAlyywvqtNXja0HFQ7jGVwoUA0HUBNcMvRdpW8PpzDPYRAERfmNE/TDuE8Ajis4oJAiUwB2+g+am3YEEmT5kz4HgOdRygHUIPEMsFf/YvXJYoSKbPczQI4HwysSbKKBdk4dLAhJsptrUHK1lSERUDYD6E9pGLsjoXzRZgAIJVaYBCCfA57zMBoJYfV9CXDigHhRgww2Hgngh4UjnCUbJAs2CEdCkl25kbou5ABh0KkXPupA6IB8fOUF4TpFOs5Eg50eFSOBfOz0GYCWoJwDoJzwcjQBfM2rMAjD0CEsL/Qp4ISG/FHkuJ4A9toXv66KomosMMNAuAA6GxOWPwqP64sb3kTm7HX1Fbsued9BXjACZKNIphLz/FF4WIps6vqff+jaIFAONiBbTf1hDITti5RLg+cYoDOxqJFwxb0dXmT5Bn/Pn8wOh9dQnMASK4aaSGuk+G24DObCbm5XzkXs9RdASTuytUZO6Czdm2BCA2cSgNbIWedxk0AV4FVYEYFJpLK4SuA3DrsceQEQl6svXy33CKfxIrwAanqZBA8R4AAQWeUMwJ6CZ7t7BIh6utfos0uLwxqP7BECMaTUuQCoawhO+9sSUWtjs1kA9I1Fm8DoNiCl64nUCsp9Ym1SgncjoLoz7YTl9dNOtbGRYSAjWbMDNPKw3py0otNeufVYN2wvzha5g6iGzlTDebsfEdbtW9EsLOvYZs06Dmbsq4GjcoeBgThBWtRN2zZ1mYUuGZ7axfz9hZEns+mMQ+ckzIYm/gn+WQvWWRq6uoxuSNi4RWWAYGfRuCtjXx25Bh25MGaTFzaccCVX1wfPtkiCk+e6nh/ExXps/N6z80PyL8wPTYgPwzDiAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDExLTAxLTE5VDAzOjU5OjAwKzAxOjAwaFry6QAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxMC0xMi0yMVQxNDozMDo0NCswMTowMGxOe/8AAAAZdEVYdFNvZnR3YXJlAEFkb2JlIEltYWdlUmVhZHlxyWU8AAAAAElFTkSuQmCC"
        };
        var img = new Image();

        img.onload = function () {
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
        };

        img.src = model.imageSrc;
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

    return {
        canvasDrawing: canvasDrawing,
        canvasDraw   : canvasDraw
    };
});

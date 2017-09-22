CKEDITOR.editorConfig = function (config) {
    'use strict';

    config.skin = 'minimalist,' + '/src/public/js/helpers/ckeditor/skins/minimalist/';
    config.contentsCss = '/src/public/js/helpers/ckeditor/contents.css';
    config.toolbarGroups = [
        {name: 'styles', groups: ['styles']},
        {name: 'document', groups: ['mode', 'document', 'doctools']},
        {name: 'clipboard', groups: ['clipboard', 'undo']},
        {name: 'editing', groups: ['find', 'selection', 'spellchecker', 'editing']},
        {name: 'forms', groups: ['forms']},
        {name: 'basicstyles', groups: ['basicstyles', 'cleanup']},
        {name: 'colors', groups: ['colors']},
        {name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi', 'paragraph']},
        {name: 'links', groups: ['links']},
        {name: 'insert', groups: ['insert']},
        {name: 'tools', groups: ['tools']},
        {name: 'others', groups: ['others']}
    ];

    config.removePlugins = 'elementspath';

    config.removeButtons = 'Source,Save,NewPage,Preview,Print,Templates,Cut,Copy,Paste,PasteText,PasteFromWord,Undo,Redo,Find,Replace,SelectAll,Scayt,Form,Checkbox,Radio,TextField,Textarea,Select,Button,ImageButton,HiddenField,Subscript,Superscript,Outdent,Indent,Blockquote,CreateDiv,BidiLtr,BidiRtl,Link,Unlink,Anchor,Image,Flash,Table,HorizontalRule,Smiley,SpecialChar,PageBreak,Iframe,Styles,Format,ShowBlocks,Language,Font,Maximize';

    config.resize_enabled = false;
    config.resize_minHeight = 80;
    config.colorButton_enableMore = false;
};

CKEDITOR.on('instanceReady', function (ev) {
    var blockTags = ['div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'li', 'blockquote', 'ul', 'ol',
        'table', 'thead', 'tbody', 'tfoot', 'td', 'th'];

    for (var i = 0; i < blockTags.length; i++) {
        ev.editor.dataProcessor.writer.setRules(blockTags[i], {
            indent          : false,
            breakBeforeOpen : false,
            breakAfterOpen  : false,
            breakBeforeClose: false,
            breakAfterClose : false
        });
    }
});
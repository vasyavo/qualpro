var ImportHandler = function (db) {
    var xlsxDataImporter = require('../helpers/xlsxDataImporter')(db);

    this.importFromFolderPart2 = function (req, res, next) {
        xlsxDataImporter.importFromFile('import/ItemsAlalali.xlsx', function (success) {
            if (success) {
                res.status(200).send('Import succeeded');
            }
        });
    };

    this.importFromFolderPart1 = function (req, res, next) {
        xlsxDataImporter.importFromFile('import/QualPro_Mass_Upload_Batch.xlsx', function (success) {
            if (success) {
                res.status(200).send('Import succeeded');
            }
        });
    };

    this.importOrigins = function (req, res, next) {
        xlsxDataImporter.importFromFile('import/originsImport.xlsx', function (success) {
            if (success) {
                res.status(200).send('Import succeeded');
            }
        });
    };
};

module.exports = ImportHandler;
var DocsHandler = function (db) {
    var fs = require('fs');

    this.getDb = function(req, res, next){
        var filePath = './config/dbArchitecture/DbDiagram.pdf';
        var stat = fs.statSync(filePath);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': stat.size
        });

        var readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    }
};

module.exports = DocsHandler;
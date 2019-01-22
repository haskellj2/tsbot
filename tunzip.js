const unzip = require('unzip');
const fs = require('fs');

/* https://github.com/EvanOxfeld/node-unzip 

https://stackoverflow.com/questions/3133243/how-do-i-get-the-path-to-the-current-script-with-node-js
http://voidcanvas.com/get-working-directory-name-and-file-name-in-node/

http://voidcanvas.com/understanding-ember-data-models-ember-js-tutorial-part-7/


*/
fs.createReadStream('U:\_8/minute/2016-06-03.zip')
    .pipe(unzip.Parse())
    .on('entry', function(entry) {
        var fileName = entry.path;
        var type = entry.type; // 'Directory' or 'File'
        var size = entry.size;

        debugger;

        entry.pipe(fs.createWriteStream('U:\_8/minute/test.csv'));

        entry.autodrain();

        if (fileName === "this IS the file I'm looking for") {
            entry.pipe(fs.createWriteStream('output/path'));
        } else {
            entry.autodrain();
        }
    });

/*
--Process each zip file entry or pipe entries to another stream.
Important: If you do not intend to consume an entry stream's raw data, call autodrain() to dispose of the entry's contents. Otherwise you risk running out of memory.

fs.createReadStream('path/to/archive.zip')
  .pipe(unzip.Parse())
  .on('entry', function (entry) {
    var fileName = entry.path;
    var type = entry.type; // 'Directory' or 'File'
    var size = entry.size;
    if (fileName === "this IS the file I'm looking for") {
      entry.pipe(fs.createWriteStream('output/path'));
    } else {
      entry.autodrain();
    }
  });
*/

/*
--Or pipe the output of unzip.Parse() to fstream


var readStream = fs.createReadStream('path/to/archive.zip');
var writeStream = fstream.Writer('output/path');

readStream
  .pipe(unzip.Parse())
  .pipe(writeStream)
*/
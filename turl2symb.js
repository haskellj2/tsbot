var Murl2symb = require('./murl2symb.js');

Murl2symb.getSymbByUrl('/equitdddies/mobilnye-telesiste666my-adr')
    .then(function(symb) {
        //console.log('then symb: ' + symb);
        //'' or valid symb
        if (symb === '') {
            console.log('no symb found by this url');
        } else if (symb.length > 0) {
            console.log(`valid symb: ${symb}`);
        }
    });
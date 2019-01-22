var Mpg = require('./mpg.js');

Mpg.getSymbByPid(999)
    .then(function(symb) {
        //console.log('then symb: ' + symb);
        //undefined, null or valid symb
        if (symb === undefined) {
            console.log('no records returned at all - no such pid saved in db');
        } else if (symb === null) {
            console.log('there is such a pid but symb = null for that record');
        } else if (symb.length > 0) {
            console.log(`valid symb: ${symb}`);
        }
    });
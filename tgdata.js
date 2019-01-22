var Mgdata = require('./mgdata.js');

Mgdata.getGdata('AAPL', 60)
    .then(function(res) {
        console.log('then 1: ' + res);

    });

console.log('no-blocking 1');

Mgdata.getGdata('AREX', null)
    .then(function(res) {
        console.log('then 2: ' + res);

    });

console.log('no-blocking 2');
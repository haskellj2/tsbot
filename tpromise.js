var Msymb = require('./msymb.js');

Msymb.getSymbByPidUrl(257, '/equities/dell-inc')
    .then(function(res) {
        console.log('then 1: ' + res);

    });

console.log('no-blocking 1');

Msymb.getSymbByPidUrl(257, null)
    .then(function(res) {
        console.log('then 2: ' + res);

    });

console.log('no-blocking 2');
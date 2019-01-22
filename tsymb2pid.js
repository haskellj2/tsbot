var Msymb2pid = require('./msymb2pid.js');

// cvm 2
// rttr 1 
Msymb2pid.getPidBySymb('CVM')
    .then(function(res) {
        console.log('then: ' + res);

    })
    .catch((err) => console.log(err.message));
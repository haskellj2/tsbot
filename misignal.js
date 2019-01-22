var Misignal = function() {};

Masignal.prototype.checkPatterns = function(symb) {
    if (symb === null || symb === undefined || symb.trim().length === 0) {
        reject();
    }

    var Mgiata = require('./mgidata.js');

    Midata.getIdata(symb)
        .then(function(data) {
            // log found pattern name with confidence [1..10], where 1=weakest and 10=strongest

            // time period : 9:30:00-9:33.20... monitoring recent one-day +30% stocks
            checkOpenHigherTrendHigherWithBidTrendingUp(data);



        });


};

module.exports = new Misignal();
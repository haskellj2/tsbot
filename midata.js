var Midata = function() {};

Midata.prototype.getIdata = function(symb) {
    // get data from LokiJS

    var promise = new Promise((resolve, reject) => {
        if (symb === null || symb === undefined || symb.trim().length === 0) {
            reject();
        }

        resolve();
    });

    return promise;

};

module.exports = new Midata();
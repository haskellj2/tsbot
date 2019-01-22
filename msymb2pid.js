var Msymb2pid = function() {};

Msymb2pid.prototype.getPidBySymb = function(symb) {

    const { Pool } = require('pg');

    const botdbConfig = require('./ts_configurations').get_bot_db_config();
    const pool = new Pool(botdbConfig);

    var promise = new Promise((resolve, reject) => {
        if (symb === null || symb === undefined || symb.trim().length === 0) {
            reject(new Error('symb parameter not provided'));
            return;
        }

        const pidQuery = {
            text: `SELECT pid FROM t.iqmap WHERE symb = $1 order by pid asc`,
            values: [symb]
        };
        pool.query(pidQuery)
            .then(res => {
                if (res.rowCount === 0) {
                    reject(new Error('no records returned'));
                    return;
                }

                //var pid = res.rows[0].pid;
                //resolve(pid);

                let pids = res.rows.reduce((total, item) => {
                    return total === '' ? item.pid : total + '|'.concat(item.pid);
                }, '');
                resolve(pids);
                return;

            })
            .catch(err => {
                console.error(err.stack);
                reject(new Error('error: ' + err.stack));
                return;
            });


    });



    return promise;


};

module.exports = new Msymb2pid();
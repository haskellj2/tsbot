var Mpg = function() {};

const { Pool } = require('pg');

const botdbConfig = require('./ts_configurations').get_bot_db_config();
const pool = new Pool(botdbConfig);

Mpg.prototype.getSelectedPidArray = function() {
    var promise = new Promise((resolve, reject) => {
        const query = {
            text: `SELECT pid, symb FROM t.iqmap WHERE iactive = true or iactive is null`
        };
        pool.query(query)
            .then(res => {
                if (res.rowCount === 0) {
                    reject(new Error('no records returned'));
                    return;
                }

                let pids = res.rows.reduce((total, item) => {
                    total.push(item.pid);
                    return total;
                }, []);
                resolve(pids);

                // from-symb-to-setups

                return;
            })
            .catch(err => {
                //console.log(query.values);
                console.error(err.stack);
                reject(new Error('error: ' + err.stack));
                return;
            });
    });

    return promise;
};

Mpg.prototype.getSymbByPid = function(pid) {
    var promise = new Promise((resolve, reject) => {
        const query = {
            text: `SELECT symb FROM t.iqmap WHERE pid = $1`,
            values: [pid]
        };
        pool.query(query)
            .then(res => {
                // no record at all
                if (res.rowCount === 0) {
                    //reject(new Error('no records returned'));
                    resolve(undefined);
                    return;
                }

                // null or valid symb
                const symb = res.rows[0].symb;
                resolve(symb);
                /*
                let pids = res.rows.reduce((total, item) => {
                    return total === '' ? item.pid : total + '|'.concat(item.pid);
                }, '');
                resolve(pids);
                */

                return;
            })
            .catch(err => {
                //console.log(query.values);
                console.error(err.stack);
                reject(new Error('error: ' + err.stack));
                return;
            });
    });

    return promise;
};

Mpg.prototype.setSymbByPid = function(pid, symb) {
    var promise = new Promise((resolve, reject) => {
        const query = {
            text: `UPDATE t.iqmap SET symb = $2 WHERE pid = $1`,
            values: [pid, symb]
        };
        pool.query(query)
            .then(() => resolve())
            .catch(err => {
                //console.log(query.values);
                console.error(err.stack);
                reject(new Error('error: ' + err.stack));
                return;
            });
    });

    return promise;
};

Mpg.prototype.Save2pg = function(tableName, data) {
    // tableName: iexthours, iqmap, irealtime
    var promise = new Promise((resolve, reject) => {
        let query;
        if (tableName === 'irealtime') {
            // testing direct use data in values: ?????
            const [pid, last, bid, ask, high, low, last_close, pc, pcp, turnover, turnover_numeric, time, timestamp, date] = data;
            query = {
                text: `INSERT INTO t.irealtime(pid, last, bid, ask, high, low, last_close, pc, pcp, turnover, turnover_numeric, time, timestamp, date) 
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                values: [pid, last, bid, ask, high, low, last_close, pc, pcp, turnover, turnover_numeric, time, timestamp, date]
            };
        } else if (tableName === 'iexthours') {
            const [pid, last, bid, ask, pc, pcp, turnover, turnover_numeric, time, timestamp, date] = data;
            query = {
                text: `INSERT INTO t.iexthours(pid, last, bid, ask, pc, pcp, turnover, turnover_numeric, time, timestamp, date) 
                VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                values: [pid, last, bid, ask, pc, pcp, turnover, turnover_numeric, time, timestamp, date]
            };
        } else if (tableName === 'iqmap') {
            const [pid, url, symb] = data;
            // input pid / url, output symb
            if (symb !== undefined) {
                query = {
                    text: `INERT INTO t.iqmap (pid, url, symb) VALUES($1, $2, $3)`,
                    values: [pid, url, symb]
                };
            } else {
                query = {
                    text: `INERT INTO t.iqmap (pid, url) VALUES($1, $2)`,
                    values: [pid, url]
                };

            }
            // input qid, output symb - for sell, position
            // input symb, output pid
            // input symb, output qid
            /*
            else if (data.qid !== undefined && data.symb !== undefined) {
                query = {
                    text: `UPDATE t.iqmap SET qid = $1 WHERE symb = $2`,
                    values: [data.qid, data.symb]
                };
                runPoolonQuery(pool, query, resolve, reject);
            } 
            */
        }

        runPoolonQuery(pool, query, resolve, reject);

        getSymbByPid(pid);
    });

    return promise;
};

function runPoolonQuery(pool, query, resolve, reject) {
    pool.query(updateQuery)
        .then(res => {
            //console.log(res.command + ' : ' + pid + ' ' + pcp + ' ' + res.rowCount + ' row(s)');
            resolve();
            return;
        })
        .catch(err => {
            //console.log(query.values);
            console.error(err.stack);
            reject(new Error('error: ' + err.stack));
            return;
        });
}

module.exports = new Mpg();
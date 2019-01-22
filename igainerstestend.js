const https = require('https');
const cheerio = require('cheerio');

const { Pool } = require('pg');

const botdbConfig = require('./ts_configurations').get_bot_db_config();
const options = {
    hostname: 'www.investing.com',
    port: 443,
    path: '/equities/top-stock-gainers',
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36',
        'accept': '*/*'
    },

};


var igResponse = '';

const req = https.request(options, (res) => {

    console.log('statusCode', res.statusCode);
    console.log('statusMessage', res.statusMessage);

    res.on('data', (d) => {
        //process.stdout.write(d);
        if (igResponse.length < 500000) {
            igResponse += d;
        }
    });

    res.on('end', () => {
        igResponse = igResponse.substr(igResponse.indexOf("genTbl closedTbl elpTbl elp25 crossRatesTbl") - 14, 50000);
        igResponse = igResponse.substr(0, igResponse.indexOf("</table>") + 8);
        //console.log(igResponse);

        const $ = cheerio.load(igResponse);
        $('table.genTbl > tbody > tr').each((idx, item) => {
            const pid = $('td[class="left bold plusIconTd elp"] > span', item).prop('data-id');

            const fullname = $('td[class="left bold plusIconTd elp"] > a', item).prop('title');
            const url = $('td[class="left bold plusIconTd elp"] > a', item).prop('href');
            const name = $('td[class="left bold plusIconTd elp"] > a', item)[0].childNodes[0].data;

            const last = $('td[class="align_right pid-' + pid + '-last"]', item)[0].childNodes[0].data;
            const high = $('td[class="align_right pid-' + pid + '-high"]', item)[0].childNodes[0].data;
            const low = $('td[class="pid-' + pid + '-low"]', item)[0].childNodes[0].data;
            const pc = $('td[class="bold greenFont pid-' + pid + '-pc"]', item)[0].childNodes[0].data;

            const pcp = $('td[class="bold greenFont pid-' + pid + '-pcp"]', item)[0].childNodes[0].data;
            const pcpnumeric = parseFloat(pcp.replace('%', ''));

            const turnover = $('td[class="pid-' + pid + '-turnover"]', item)[0].childNodes[0].data;
            const turnovernumeric = Math.round(turnover.replace(',', '').replace('M', '').replace('K', '') * (turnover.indexOf('M') > -1 ? 1000000 : 1) * (turnover.indexOf('K') > -1 ? 1000 : 1));

            var time = $('td[class="pid-' + pid + '-time"]', item)[0].childNodes[0].data;
            var date = new Date();
            date.setHours(0, 0, 0, 0);

            if (time.indexOf('/') > -1) {
                time = '16:00:00';
            }

            if (new Date().getDay() == 0) {
                date.setDate(date.getDate() - 2);
            } else if (new Date().getDay() == 7) {
                date.setDate(date.getDate() - 1);
            } else if (new Date().getDay() == 1 && new Date().getHours() < 9) {
                date.setDate(date.getDate() - 3);
            } else if (new Date().getHours() < 9) {
                date.setDate(date.getDate() - 1);
            }

            const pool = new Pool(botdbConfig);

            pool.connect((err, client, done) => {
                done();
            });


        });

        console.log('table done');
    });
    console.log('res end');
});



//req.on('error', (e) => {
//    console.error(e);
//});

req.end(function() {
    console.log('req end');
});
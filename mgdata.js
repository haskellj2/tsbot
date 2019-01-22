var Mgdata = function() {};

Mgdata.prototype.getGdata = function(symb, iPeriod) {
    if (iPeriod === null || iPeriod === undefined || iPeriod == 0) {
        iPeriod = 60;
    }
    const pDuration = iPeriod == 60 ? "5d" : iPeriod == 300 ? "25d" : iPeriod == 86400 ? "50d" : "50d";
    const url = [symb.toUpperCase(), iPeriod.toString(), pDuration].reduce(
            (str, val) => { return str.replace(/%s/, val); },
            "/finance/getprices?q=%s&i=%s&p=%s&f=d,c,h,l,o,v"
        )
        // 1 min: i=60, p:5d https://www.google.com/finance/getprices?q=AAPL&i=60&p=50d&f=d,c,h,l,o,v
        // 5 min: i=300, p:25d https://www.google.com/finance/getprices?q=AAPL&i=300&p=1d&f=d,c,h,l,o,v
        // 1 d: i=86400 p:max50d, https://www.google.com/finance/getprices?q=AAPL&i=86400&p=100d&f=d,c,h,l,o,v

    const https = require('https');

    var promise = new Promise((resolve, reject) => {
        if (symb === null || symb === undefined || symb.trim().length === 0) {
            reject();
        }

        return getGdata(url);
        /*
        getGdata(url)
            .then((gdata) => {

                resolve(gdata);

            });
        */

        function getGdata(url) {
            const options = {
                hostname: 'www.google.com',
                port: 443,
                path: url,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36',
                    'accept': '*/*'

                },
            };

            var iResponse = '';

            var promise = new Promise((resolve, reject) => {
                const req = https.request(options, (res) => {
                    //console.log('statusCode', res.statusCode);
                    //console.log('statusMessage', res.statusMessage);

                    res.on('data', (d) => {
                        //console.log(d);
                        //process.stdout.write(d);
                        iResponse += d;
                    });

                    res.on('end', () => {
                        //console.log(iResponse);
                        const csvArray = iResponse.substr(iResponse.indexOf('TIMEZONE_OFFSET=-240') + ('TIMEZONE_OFFSET=-240').length + 1).trim().split("\n");
                        let ohlc = [],
                            volume = [],
                            t = "";

                        for (let i = 0; i < csvArray.length; i++) {

                            const lineArr = csvArray[i].split(",");
                            if (t === "" && lineArr[0][0] === "a") {
                                t = parseInt(lineArr[0].substr(1) + "000") - 14400000; // 60,000 * 60 * 4 = 14400000 :: 4 hours
                                dayStart = t;
                            } else if (lineArr[0][0] === "a") {
                                t = parseInt(lineArr[0].substr(1) + "000") - 14400000;
                            } else {
                                t += parseInt(lineArr[0]) * 60000;
                            }

                            ohlc.push([
                                t,
                                parseFloat(lineArr[4]),
                                parseFloat(lineArr[2]),
                                parseFloat(lineArr[3]),
                                parseFloat(lineArr[1])
                            ]);

                            volume.push([
                                t,
                                parseInt(lineArr[5])
                            ]);
                        }

                        console.log(ohlc.reduce(
                            (str, val) => str + "\n" + (val.reduce(
                                (str2, val2) => str2.length === 0 ? val2.toString() : str2 + ", " + val2.toString(),
                                ""
                            )),
                            ""
                        ));
                        resolve(ohlc);

                    });

                    //req.on('error', (e) => {
                    //    console.error(e);
                    //});
                })

                req.end(function() {
                    //console.log('req end');
                });
            });


            return promise;

        }






    });



    return promise;


};

module.exports = new Mgdata();
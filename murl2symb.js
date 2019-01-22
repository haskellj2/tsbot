var Murl2symb = function() {};

Murl2symb.prototype.getSymbByUrl = function(url) {

    const https = require('https');
    const cheerio = require('cheerio');

    var promise = new Promise((resolve, reject) => {
        if (url !== null && url !== undefined && url.trim().length > 0) {
            getSymbByUrl(url)
                .then((symb) => {
                    resolve(symb);
                    return;
                });
        }
    });

    return promise;

    function getSymbByUrl(url) {
        const options = {
            hostname: 'www.investing.com',
            port: 443,
            path: url,
            method: 'GET',
            headers: {
                //GET /equities/bio-blast-phrma HTTP/1.1
                'Host': 'm.investing.com',
                'Connection': 'keep-alive',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
                'Upgrade-Insecure-Requests': 1,
                'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Mobile Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                //'Accept-Encoding': 'gzip, deflate, br',
                'Accept-Language': 'en-US,en;q=0.8',
                'Cookie': 'adBlockerNewUserDomains=1501515428; optimizelyEndUserId=oeu1501515428667r0.0340354869914794; __qca=P0-2126023527-1501515430057; __gads=ID=e7109d48c505ef50:T=1501515430:S=ALNI_MacnlvN1rvVaQTFSE5Ez8myCJlHoQ; PHPSESSID=eqb4sssjaheingp0765lrk7fe3; StickySession=id.93043251681.209.m.investing.com; optimizelySegments=%7B%224225444387%22%3A%22gc%22%2C%224226973206%22%3A%22referral%22%2C%224232593061%22%3A%22false%22%2C%225010352657%22%3A%22none%22%2C%225799410008%22%3A%22gc%22%2C%225803260009%22%3A%22none%22%2C%225796780005%22%3A%22direct%22%2C%225793730061%22%3A%22true%22%7D; optimizelyBuckets=%7B%228465822231%22%3A%228464003526%22%2C%228543560511%22%3A%220%22%7D; _ga=GA1.2.124552790.1501515429; _gat_allSitesTracker=1; _gat=1'
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
                    if (iResponse.length <= 900) {
                        iResponse += d;
                    } else {
                        return;
                    }

                    if (iResponse.length > 900) {
                        return;
                    }
                });

                res.on('end', () => {
                    //console.log(iResponse);
                    //iResponse.substr(0, 900);
                    const symb = iResponse.substr(iResponse.indexOf('<title>') + 7, iResponse.substr(iResponse.indexOf('<title>') + 7).indexOf('|') - 1);
                    resolve(symb);
                    return;
                });

                //req.on('error', (e) => {
                //    console.error(e);
                //});
            });

            req.end(function() {
                //console.log('req end');
            });
        });

        return promise;
    }

};


module.exports = new Murl2symb();
import { SMA, EMA, BollingerBands } from 'technicalindicators';




checkMirroredDropThenCrossUp = function(data, min) {
    debugger;
    let period38 = 38,
        period116 = 38;
    //let closes = data..filter(p..map(p => p.close);
    console.log(SMA.calculate(data.map(p => p.close)));


};



var Mgsignal = function() {};

Mgsignal.prototype.checkPatterns = function(symb, min) {
    if (symb === null || symb === undefined || symb.trim().length === 0) {
        reject();
    }

    var Mgdata = require('./mgdata.js');

    Mgdata.getGdata(symb, 60)
        .then(function(data) {

            checkMirroredDropThenCrossUp(data, min);

            // log found pattern name with confidence [1..10], where 1=weakest and 10=strongest

            // time period : 9:50-10:05 11:55-12:55 1:30-3:45
            // WAC box breakout 1:00pm and 2:35pm - 10
            //checkBoxBreakout(data);

            // exclude A_ or L from MA support pattern
            // IMUC 0822 116 support - 10
            //checkUpChannelThenDeepDipUnder116(data);
            //check116and3lines1point(data);

            // FALC, PRPO, INPX...
            // FALC... top loser: pc: 0.40, 9:30 0.37 - 7.5%, 9:52 0.33, 10:01 0.355, 10:40 0.33
            // 10:03 MAs and 116 all start up trending: s38 0.3379 e38 0.3403 116 0.3473 - 11:29 0.3486 0.3481 0.3486 [0.35] buy! 1:49 0.3795 sell!
            // inpx bot 11:11 0.26 sell 12:22 0.29
            //checkTopLCrossUpMAs(data);





            // only for 9:30 to 9:35
            //checkSTsurge(data);

            // exclude A_ or L from MA support pattern
            // exclude IDXG 0822
            // NM 0822 9:30-10:10
            // RTNB 0822 MAs support - 10
            //checkUpChannelMAs(data);

            // checkVBreakout(data);





            // AMPE - break out the high of two previous days - Mon 0821 11:48:52 0.414 above 0.41 at Fri 0818 1:25:26pm and 0.398 at Thur 0817 09:30am
            // Tues 0822 12:44:17 $53.0 + 25%
            // Thur 0817 Sudden drop...Fri 0818 small up channel wave
            //checkDirectOffering2ThirdBuy(data);
        });

    function checkBoxBreakout(data) {


    }
};

module.exports = new Mgsignal();
var Mimoverspm = require('./mimoverspm.js');

const schedule = require('node-schedule');
/*
const { minute, hour, day, month } = function(date) {
    date.setMinutes(date.getMinutes() + 1);
    return {
        minute: date.getMinutes(),
        hour: date.getHours(),
        day: date.getDate(),
        month: date.getMonth() + 1
    };
}(new Date());
*/

//console.log('3 ' + minute.toString() + ' ' + hour.toString() + ' ' + day.toString() + ' ' + month.toString() + ' *');

var job1 = schedule.scheduleJob('3 18 20 * * *', function() {

    Mimoverspm.saveTopDailyGLs();

});



/*
Mgdata.getGdata('AREX', null)
    .then(function(res) {
        console.log('then 2: ' + res);

    });
*/
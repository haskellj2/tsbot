var Mheartbeat = function() {};

const sender, receiver = require('./ts_configurations').get_bot_email_config();
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: sender.service,
    auth: {
        user: sender.user,
        pass: sender.pass
    }
});

var mailOptions = {
    from: sender.user,
    to: sender.receiver
};

Mheartbeat.prototype.sendHeartbeat = function() {
    
    mailOptions.subject = new Date().toLocaleTimeString();
    mailOptions.text = '';

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            //console.log('Email sent: ' + info.response);
        }
    });
};

Mheartbeat.prototype.sendInfo1 = function(pid, url) {

    mailOptions.subject = `pid: ${pid}, url: ${url}, ` + new Date().toLocaleTimeString();
    mailOptions.text = 'cannot get symb by url';

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            //console.log('Email sent: ' + info.response);
        }
    });
};

module.exports = new Mheartbeat();

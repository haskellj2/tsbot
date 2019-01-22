var Mheartbeat = function() {};

Mheartbeat.prototype.sendHeartbeat = function() {
    var nodemailer = require('nodemailer');

    const sender, receiver = require('./ts_configurations').get_bot_email_config();
    var transporter = nodemailer.createTransport({
        service: sender.service,
        auth: {
            user: sender.user,
            pass: sender.pass
        }
    });

    var mailOptions = {
        from: sender.user,
        to: sender.receiver,
        subject: new Date().toLocaleTimeString(),
        text: ''
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            //console.log('Email sent: ' + info.response);
        }
    });
};

Mheartbeat.prototype.sendInfo1 = function(pid, url) {
    var nodemailer = require('nodemailer');

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'tbot.ji@gmail.com',
            pass: '@Tbot2017'
        }
    });

    var mailOptions = {
        from: 'tbot.ji@gmail.com',
        to: 'henry.x.ji@gmail.com',
        subject: `pid: ${pid}, url: ${url}, ` + new Date().toLocaleTimeString(),
        text: 'cannot get symb by url'
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            //console.log('Email sent: ' + info.response);
        }
    });
};

module.exports = new Mheartbeat();
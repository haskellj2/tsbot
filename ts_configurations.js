var ts_configurations = function() {};

ts_configurations.prototype.get_bot_db_config = function() {

    const bot_db_Config = {
        host: 'localhost',
        port: 2828,
        database: 'botdb',
        user: 'botuser',
        password: '[PASSWORD]',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,

    };

    return bot_db_Config;
};

ts_configurations.prototype.get_bot_email_config = function() {
    const sender = {
        service: 'gmail',
        user: 'tbot.ji@gmail.com',
        pass: '[PASSWORD]'
    }

    const receiver = 'playwithhaskell@gmail.com'

    return (sender, receiver)
};

module.exports = new ts_configurations();

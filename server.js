var Server = require('./libs/server');

var server = new Server({
    app : 'production',
    port : 80,
    mongoDB : {
        db : 'db'
    }
});

server.start();
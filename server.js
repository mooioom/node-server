var Server = require('./libs/server');

var server = new Server({
    app : 'boilerplate',
    port : 80,
    mongoDB : {
        db : 'db'
    }
});

server.start();
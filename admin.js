var Server = require('./libs/server');

var server = new Server({
    app : 'admin',
    port : 3952,
    mongoDB : {
        db : 'admin'
    }
});

server.start();
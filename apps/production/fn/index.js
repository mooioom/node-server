module.exports = function( d ){

    return server.templates.load({
        file : 'index',
        data : {
            name : 'David'
        }
    });

}
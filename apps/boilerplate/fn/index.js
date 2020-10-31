module.exports = function( d ){

    return server.templates.load({
        file : 'index',
        data : {
            abc : 1
        }
    });

}
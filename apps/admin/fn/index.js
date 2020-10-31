module.exports = function( d ){

    var admin = session.get('user');

    return server.templates.load( admin ? 'dashboard' : 'login' );

}
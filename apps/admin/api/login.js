module.exports = function( d, res, success ){

    var p = d.post;

    if(!p || !p.name || !p.password) return false;

    db.collection('Users').findOne({

        name : p.name,
        password : p.password

    },function(err,user){

        session.set('user',user);
        success( user );

    });

    return '__await';

}
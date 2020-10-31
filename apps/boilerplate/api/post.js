module.exports = function( data ){

    var users = db.collection('users');

    var views = session.get('views');
    if(!views) views = 0;
    views++;

    session.set('views',views);

    users.insert(data.post);

    return users.all();

}
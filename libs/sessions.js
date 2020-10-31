class Session{

    constructor( s, sessions ){

        for(var x in s) this[x] = s[x];

        this.sessions = sessions;

        if(!this.data) this.data = {};

    }

    save(){

        var sessions = fdb.collection( this.sessions.settings.dbName );

        var all = sessions.all();

        all.forEach( s => {
            if(s.uid == this.uid) s.data = this.data;
        });

        sessions.set(all);

    }

    set( prop, value ){
        this.data[prop] = value;
        this.save();
    }

    get( prop ){
        return this.data[prop];
    }

}

class Sessions{

    constructor( settings ){

        var SECOND = 1000;
        var MINUTE = SECOND * 60;
        var HOUR   = MINUTE * 60;

        var DEFAULTS = {

            cookieName : 'server',
            dbName     : 'sessions',

            timeout : HOUR * 10,

            cleanup_timeout : HOUR

        }

        this.settings = Object.assign( DEFAULTS, settings );

        this.cookieName = this.settings.cookieName;

        setInterval( this.cleanup.bind(this), this.settings.cleanup_timeout);

    }

    cleanup(){

        console.log('sessions :: cleanup');

        var sessions = fdb.collection(this.settings.dbName);

        var all = sessions.all();

        var l = all.length;

        if(!l) return;

        while(l--){
            var s = all[l];
            if( s.last_update && (new Date().getTime() - s.last_update) > this.settings.timeout ) all.splice( all.indexOf(s), 1 );
        }

        sessions.set(all);

    }

    uid( l ){
        l = l || 10;
        var s = '';
        var b = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('')
        while(l--) s+= b[ Math.floor(Math.random()*b.length) ];
        return s;
    }

    create( req, res ){

        var uid = this.uid( 10 );

        console.log('sessions :: create',uid);

        var sessions = fdb.collection(this.settings.dbName);

        var s = {
            uid : uid,
            last_update : new Date().getTime(),
            data : {}
        }

        sessions.insert(s);

        res.setHeader( 'set-cookie', this.cookieName+'='+uid );

        return new Session(s,this);

    }

    init( req, res ){

        var cookie = req.headers.cookie;

        var uid = null;

        if( cookie ){

            var cookies = {};

            cookie.split(';').forEach(b=>{
                var c = b.trim();
                if(c.indexOf('=') == -1) return;
                var d = c.split('=');
                cookies[d[0]] = d[1];
            });

            uid = cookies[this.cookieName];

        }

        if( !uid ) return this.create( req, res );
        else{

            var sessions = fdb.collection(this.settings.dbName);

            var all = sessions.all();

            var current = null;
            
            all.forEach(s=>{ 
                if( s.uid == uid ){
                    current = s;
                    s.last_update = new Date().getTime();
                }
            });

            if(!current) return this.create( req, res );
            else{
                sessions.set(all);
                return new Session(current,this);
            }

        }

    }

}

module.exports = Sessions;
var fs = require('fs');

class DB_Collection{

    constructor( s ){

        this.name = s.name;
        this.db   = s.db;

        this.path = this.db.path + '/' + this.name + '.json';

        if( !fs.existsSync(this.path) ) this.create();

    }

    create(){

        if(!this.name) return false;

        var data = [];

        return fs.appendFileSync( this.path ,JSON.stringify(data) );

    }

    all(){
        var data = fs.readFileSync(this.path).toString();
        return JSON.parse(data);
    }

    find( q ){
        var all = this.all();
        var f = [];
        all.forEach(a=>{
            var flag = true;
            for(var x in q){ if(a[x] != q[x]) flag = false; }
            if(flag) f.push(a);
        });
        if(!f.length) return false;
        if(f.length == 1) return f[0];
        return f;
    }

    update( q ){

    }

    insert( data ){

        if( typeof data != 'object' ) return false;

        var d = this.all();

        if( Array.isArray(data) ) d = d.concat(data);
        else d.push(data);

        fs.writeFileSync( this.path, JSON.stringify(d) );

    }

    set( data ){

        if( typeof data != 'object' ) return false;
        if( !Array.isArray(data) ) return false;

        return fs.writeFileSync( this.path, JSON.stringify(data) );

    }

}

class DB{

    constructor( s ){

        var DEFAULTS = {

            path : '/db'

        };

        this.settings = Object.assign(DEFAULTS,s);

        if(this.settings.path.endsWith('/')) this.settings.path += '/';

        this.path = this.settings.path;

        if( !fs.existsSync(this.path) ) this.create();

    }

    create(){

        return fs.mkdirSync(this.path);

    }

    collection( name ){

        return new DB_Collection({
            name : name,
            db : this
        });

    }

}

module.exports = DB;
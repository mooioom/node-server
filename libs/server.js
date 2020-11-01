var http = require('http');
var fs   = require('fs');
var path = require('path');
var url  = require('url');

var Templates = require('./templates');
var Sessions  = require('./sessions');
var DB        = require('./db');

var DIR = path.resolve('.');

global.DIR = DIR;

/**
 * todo:
 * make non-blocking
 * languages
 * logs
 * move sessions to db
 * https
 * security
 */

class Server{

    constructor( settings ){

        var DEFAULTS = {

            port : 80,

            public : ['js','css','json','ttf','ico','svg','png','jpg','jpeg','txt'],

            app : '/',

            onrequest : function(req,res){},
            onerror   : function(req,res){},

            TEMPLATES_DIR : 'templates',
            FN_DIR        : 'fn',
            API_DIR       : 'api',
            PUBLIC_DIR    : 'public',
            DB_DIR        : 'db',
            MEDIA_DIR     : 'media',

            mongoDB : null

        };

        this.settings = Object.assign( DEFAULTS, settings );

        this.env = {};

        var args = global.process.argv.slice(2);

        args.forEach( a => {
            var s = a.split('='); var v = '';
            try{ v = JSON.parse(s[1]); }catch(e){ v = s[1]; }
            this.env[s[0]] = v;
        });

        if(this.env.port) this.settings.port = this.env.port;

        if(!this.settings.app.endsWith('/')) this.settings.app += '/';

        this.root = DIR;
        this.base = DIR + '/apps/' + this.settings.app;
        this.libs = DIR + '/libs/';

        console.log( 'server :: construct :: base :: ', this.base );

        this.routes = [];

        this.templates = new Templates({
            path : this.base + this.settings.TEMPLATES_DIR
        });

        this.sessions = new Sessions();

        if( fs.existsSync( this.base + 'app.json' ) ){

            try{
                this.app = JSON.parse( fs.readFileSync( this.base + 'app.json' ) );
                global.app = this.app;
            }catch(e){
                console.log('server :: constructor :: error :: Cannot Parse / Load APP.JSON' );
            }

        }

        if( fs.existsSync( this.base + 'routes.json' ) ){

            var routes_file = this.base + 'routes.json';

            var routes = fs.readFileSync(routes_file).toString();

            try{

                routes = JSON.parse(routes);

                routes.forEach( r => {
                    this.addRoute(r);
                });

            }catch(e){
                console.log('server :: constructor :: error :: Cannot Parse ROUTES.JSON' );
            }

        }

        //

        this.fdb = new DB({
            path : this.base + this.settings.DB_DIR
        });

        global.server = this;
        global.fdb = this.fdb;

    }

    addRoute(r){
        if(!r.method) r.method = 'GET';
        this.routes.push(r);
    }

    get(r){
        r.method = 'GET';
        this.addRoute(r);
    }

    post(r){
        r.method = 'POST';
        this.addRoute(r);
    }

    generalResponse( statusCode, req, res, data ){
        // todo : make async
        res.statusCode = statusCode;
        res.end(this.templates.load({
            file : String(statusCode),
            data : data
        },html=>{
            res.end(html);
        }));
    }

    "403"( req, res, data ){ return this.generalResponse(403,req,res,data); } // forbidden
    "404"( req, res, data ){ return this.generalResponse(404,req,res,data); } // no found
    "500"( req, res, data ){ return this.generalResponse(500,req,res,data); } // server error

    public( req, res, ext ){

        //console.log('public',req.url);

        var f = this.base + this.settings.PUBLIC_DIR + req.url;
        
        if( req.url.indexOf('/__shared/') == 0 ){
            f = DIR + '/shared/' + req.url.replace('/__shared/','');
        }

        if( req.headers['decode-spaces']) f = f.replace('%20',' ');

        if( fs.exists(f,( exists )=>{

            if(!exists) return this["404"](req,res);

            var content_types = {
                'js'   : 'application/javascript',
                'css'  : 'text/css',
                'json' : 'application/json',
                'svg'  : 'image/svg+xml',
                'ttf'  : 'application/x-font-ttf',
                'png'  : 'image/png',
                'jpg'  : 'image/jpeg',
                'jpeg' : 'image/jpeg',
                'txt'  : 'text/plain'
            }
    
            var binary_types = ['ttf','png','jpg','jpeg'];
    
            res.setHeader( 'Content-Type', 
                content_types[ext] || 'text/plain'
            );

            if( ext == 'ttf' ){
                res.removeHeader('Expires');
                res.removeHeader('Cache-Control');
                res.removeHeader('Pragma');
                res.removeHeader('Content-Length');
                res.setHeader('Last-Modified','Tue, 02 Apr 1900 16:35:34 GMT');
                res.setHeader('Keep-Alive','timeout=5, max=86');
            }
    
            fs.readFile(f, (err,file)=>{

                if(!file) return this["404"](req,res,{ file : f });

                if( binary_types.indexOf(ext) == -1 ) file = file.toString();

                res.end(file);
            });

        }));

    }

    requeststart( req, res ){

        //console.log('server :: request :: start ');

        req.get = url.parse( req.url, true ).query;

        res.setHeader( 'Server', 'Eliyahu/1.0' );

        if( req.method == 'POST' ){

            try{

                var d = '';

                req.on( 'data' , s => {
                    d += s.toString();
                    // todo: flood attack
                });

                req.on('end', s => {

                    try{
                        req.post = JSON.parse(d);
                    }catch(e){
                        req.post = d;
                    }

                    this.request(req,res);

                });

            }catch(e){
                console.log('server :: requeststart :: error parsing post data');
                this.request(req,res);
            }

        }else{

            this.request(req,res);

        }

    }

    request( req, res ){

        global.req = req;
        global.res = res;

        //console.log('server :: request :: req ',req.headers['user-agent']);
        //console.log('server :: request :: req ',req);

        try{

            global.session = this.sessions.init( req, res ); // todo : set sessions should be moved
            // todo : log the request, security check
            // todo : security

            var fn;

            var routes = this.routes;
            var url = req.url;

            var route = null;

            if( req.method == 'POST' ){

                var template = url.match(/__api\/__template\/(.*)/);

                if( template && template[1] ){

                    template = template[1];

                    var html = this.templates.load({
                        file : template,
                        data : req.post || {}
                    });

                    res.setHeader('content-type','application/template');
                    res.end(html);

                    return;

                }

                fn = url.match(/__api\/(.*)/);

                if( fn && fn[1] ){

                    fn = fn[1];

                    var d = {
                        req : req,
                        res : res
                    }

                    fn = require( this.base + this.settings.API_DIR + '/' + fn );

                    d.post = req.post;

                    var r = fn( d, res, o => {
                        res.end( JSON.stringify(o) );    
                    }, err => {
                        res.statusCode(500);
                    }, req );

                    res.setHeader('content-type','application/json');

                    if( r == '__await' ) return;

                    res.end( JSON.stringify(r) );

                }

                return;

            }

            //

            for( let i in this.settings.public ) {
                var ext = this.settings.public[i];
                if( url.endsWith('.'+ext) ) return this.public( req, res, ext );
            }

            routes.forEach( r => {

                if( route ) return;

                if( r.url == url ) route = r;
                //if( r.regexp && url.match( new RegExp( r.url ,'g') ) ) route = r;
                if( url.match( new RegExp( r.url ,'g') ) ) route = r;

            });

            if( route ){

                console.log( 'server :: request :: route', route );

                // todo : make async
                var loader = ( type, d, tag ) => {

                    var a = [];

                    if( typeof d == 'string' ) a.push(d);
                    else if( Array.isArray(d) ) a = d;

                    a.forEach( b => {
                        var p = `${DIR}/shared/${type}/${b}.${type}`;
                        var c = fs.readFileSync( p ).toString();
                        res.write(`<${tag}>${c}</${tag}>`);    
                    });

                }

                if( route.js )  loader( 'js', route.js, 'script' );
                if( route.css ) loader( 'css', route.css, 'style' );
                if( route.api ) loader( 'js', 'api', 'script' );

                var d = {
                    req : req,
                    res : res,
                    route : route
                }

                if( route.fn ){

                    var d = {
                        req : req,
                        res : res
                    }

                    if( typeof route.fn == 'string' ){
                        route.fn = require( this.base + this.settings.FN_DIR + '/' + route.fn );
                    }

                    var fn = route.fn;

                    d.post = req.post;

                    var r = fn( d, res, o => {
                        res.end( route.json ? JSON.stringify(o) : r );    
                    }, err => {
                        res.statusCode(500);
                    }, req );

                    if( route.json ) res.setHeader('content-type','application/json');

                    if( r == '__await' ) return;

                    res.end( route.json ? JSON.stringify(r) : r );

                }

                if( route.template ){

                    var html = this.templates.load({
                        file : route.template,
                        data : {
                            route : route
                        }
                    });

                    res.end( html );

                }

                return;

            }

            res.end('');

        }catch(e){

            console.log('server :: request :: error',e);

            return this["500"](req,res);

        }

    }

    error(e){

        console.log('server :: error',e);

    }

    start(){

        var server = http.createServer();

        server.on('request',this.requeststart.bind(this));
        server.on('error',this.error.bind(this));

        var listen = function(){

            server.listen( this.settings.port );
            console.log( 'server :: start :: listening on port :: ' + this.settings.port );

        }.bind(this)

        var start = function(){

            if( this.settings.oninit ){

                var fn = this.settings.oninit;

                if( typeof this.settings.oninit == 'string' ){

                    fn = require( this.base + this.settings.FN_DIR + '/' + fn );

                }

                var r = fn( listen, this );

                if( r !== '__await' ) listen();

            } else listen();

        }.bind(this);

        if( this.settings.mongoDB ){

            this.MongoDB = require('mongodb');

            this.MongoDB.MongoClient.connect('mongodb://localhost:27017',function( err, client ){

                this.MongoDB.client = client;

                global.db = client.db( this.settings.mongoDB.db );

                console.log( 'MongoDB :: ready' );
                start();

            }.bind(this))

        }else start();

    }

    getJSON( path, onload ){

        return JSON.parse(  fs.readFileSync( this.base + '/' + path ) );

    }

    fn( name ){

        return require( server.base + 'fn/' + name + '.js' );

    }

}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

global.uid = uuidv4;

function randomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

global.randomString = randomString;

module.exports = Server;
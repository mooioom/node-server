window.xhrloader = function( name, callback, data, method, prefix ){

    if( typeof method == 'undefined' ) method = 'POST';
    if( typeof prefix == 'undefined' ) prefix = '__api/';

    callback = callback || function( r ){
        console.log(r);
    }

    var x = new XMLHttpRequest;

    window.xhrloader._requests.push(x);
    
    x.onreadystatechange = function(){

        if( this.status == 200 && this.readyState == 4 ){

            var r;

            var type = this.getResponseHeader('content-type');

            if(type && type == 'application/template'){
                if(callback) callback( this.responseText );
                return;
            }

            try{
                r = JSON.parse( this.responseText );
            }catch(e){
                r = undefined;
            }

            if(callback) callback(r);

        }

    }

    x.open( method, prefix + name, true );

    x.setRequestHeader('Content-Type','application/json');

    x.send( data ? JSON.stringify(data) : null );

}

window.post = function( name, callback, data ){
    xhrloader( name, callback, data, 'POST', '__api/' );
}

window.get = function( name, callback ){
    xhrloader( name, callback, null, 'GET', '' );
}

window.call = function( name, callback, data ){
    post(name,callback,data);
}

window.template = function( name, callback, data ){
    post('__template/'+name,callback,data);
}

xhrloader._requests = [];

xhrloader.abortAll = function(){

    xhrloader._requests.forEach(function(x){
        x.abort();
    })

}
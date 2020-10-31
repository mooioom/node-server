var fs = require('fs');
var vm = require('vm');

class Templates{

    constructor( settings ){

        var DEFAULTS = {

            path : '/templates'

        }

        this.settings = Object.assign( DEFAULTS, settings );

        if( !this.settings.path.endsWith('/') ) this.settings.path += '/';

    }

    parse( html, data ){

        html = html.replace(/<template(.*?(?=))<\/template>/g,(a,b,c)=>{
            var d = b.split(' ').filter(e=>{return e.indexOf('=') != -1});
            var e = {};
            d.forEach(f=>{
                var s = f.split('=');
                e[s[0]] = s[1].match(/"(.*)"/)[1];
            });
            e.data = data;
            return this.load(e);
        });

        html = html.replace(/{{{(.*?(?=}}}))}}}/g,(a,b,c)=>{
            var r = '';
            try{ r = vm.runInNewContext(b,data) }catch(e){ r = ''; };
            return r;
        });

        return html;

    }

    load( template, onhtml ){

        if( typeof template == 'string' ){

            template = {
                file : template
            }

        }

        if( !template.ext ) template.ext = 'html';
        if( !template.data ) template.data = {};

        var file = this.settings.path + template.file + '.' + template.ext;

        if( !fs.existsSync(file) ){
            console.log('server :: templates :: template does not exist',file);
            return '';
        }

        var html = fs.readFileSync(file).toString();

        return this.parse( html, template.data );

    }

}

module.exports = Templates;
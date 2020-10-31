module.exports = function(){

    return {

        user : session.get('user'),

        apps : [
            {
                name : 'admin',
                port : 8090,
                status : 1
            },
            {
                name : 'Logo :: Production :: HTTP',
                port : 80,
                status : 0
            },
            {
                name : 'Logo :: Production :: HTTPS',
                port : 443,
                status : 0
            },
            {
                name : 'Logo :: Pre-Production',
                port : 8070,
                status : 0
            },
            {
                name : 'Logo :: Development',
                port : 8060,
                status : 0
            }
        ]

    };

}
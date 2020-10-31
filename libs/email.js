/**
 * @requires nodemailer
 */

var mailer = require('nodemailer');

class Email{

    constructor( settings ){

        settings = settings || {
            email : ''
        }

        this.transporter = mailer.createTransport({

            service: 'gmail',

            auth: {
                user: app.mail.user,
                pass: app.mail.pass
            }

        });

    }

    /**
     * 
     * @param {*} o 
     * var o = {
        from    : app.mail.from,
        to      : this.data.email,
        subject : d.subject,
        html    : d.html
    }
     */
    send( o ){

        return new Promise((r,j)=>{

            this.transporter.sendMail(o, function(error, info){

                if (error) {

                    r(false);

                    console.log(error);

                } else {

                    r(true);

                    console.log('Email sent: ' + info.response);

                }
            });

        })

    }
}

module.exports = Email;
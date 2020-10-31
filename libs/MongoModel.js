/**
 * @class MongoModel
 * @requires global.db mongoDB
 */

 class MongoModel{

    constructor( collectionName, model, data ){

        this.data = Object.assign( model || {}, data );

        this.isLoaded = false;

        this.collection = db.collection( collectionName );

    }

    load( data ){ // loads data from db

        data = data || this.data;

        return new Promise((resolve,reject)=>{

            this.collection.findOne( data ).then( u => {

                if( u ){

                    this.isLoaded = true;

                    this.data = u;

                    resolve(true);

                }else{

                    resolve(false);

                }

            })

        });

    }

    create(){

        return new Promise((resolve,reject)=>{

            this.collection.insertOne( this.data ).then( result =>{

                if( result.insertedId ){

                    this.isLoaded = true;
                    this.data._id = result.insertedId;

                    resolve(this);

                }else resolve(null)

            })

        });

    }

    update(){

        return new Promise((resolve,reject)=>{

            if(!this.isLoaded) return resolve( null );

            this.collection.updateOne({
                _id : this.data._id
            },{
                $set : this.data
            }).then( result =>{

                resolve( result.modifiedCount ? true : false );

            })

        });

    }

 }

 module.exports = MongoModel;
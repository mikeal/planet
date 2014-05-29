/*
post model for mongoose
 */
var url = require('url');
var colors = require('colors');
var elasticConnection = url.parse(process.env.BONSAI_URL || 'http://localhost:9200');
var mongoose   = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema     = mongoose.Schema;

// Elastic Connection Options
var elasticConnectionAuth = elasticConnection.auth || '';
var elasticOptions = {
    secure: elasticConnection.protocol === 'https:' ? true : false,
    host:   elasticConnection.hostname,
    port:   elasticConnection.port || 443,
    auth:{
        username: elasticConnectionAuth.split(':')[0],
        password: elasticConnectionAuth.split(':')[1]
    }
};

console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Enviorment variables and various settings~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'.magenta);
console.log(('BONSAI_URL = ' + process.env.BONSAI_URL).magenta);
console.log(('ElasticOptions ' + JSON.stringify(elasticOptions).magenta));
console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~/Enviorment variables and various settings/~~~~~~~~~~~~~~~~~~~~~~~~~~~~'.magenta);

var postSchema = new Schema({
    title: {type: String, es_indexed:true, unique: true},
    link: { type: String, index: true, required: true, unique: true },
    displayDate: { type: Date, index: true, required:true, es_indexed:true},
    author: {type: String, es_indexed:true},
    isoTimeStamp: String,
    content: {type: String, es_indexed:true},
    tags: {type: String, es_indexed:true}
});

postSchema.plugin(mongoosastic, elasticOptions);
mongoose.model('postModel', postSchema);
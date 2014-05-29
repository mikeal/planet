/*
post model for mongoose
 */
var url = require('url');

var elasticConnection = url.parse(process.env.BONSAI_URL || 'http://localhost:9200');
console.log('BONSAI_URL = ' + process.env.BONSAI_URL);
var mongoose   = require('mongoose');
var mongoosastic = require('mongoosastic');
var Schema     = mongoose.Schema;

var postSchema = new Schema({
    title: {type: String, es_indexed:true, unique: true},
    link: { type: String, index: true, required: true, unique: true },
    displayDate: { type: Date, index: true, required:true, es_indexed:true},
    author: {type: String, es_indexed:true},
    isoTimeStamp: String,
    content: {type: String, es_indexed:true},
    tags: {type: String, es_indexed:true}
});

postSchema.plugin(mongoosastic, { 
    host: elasticConnection.host,
    port: elasticConnection.port
});
mongoose.model('postModel', postSchema);
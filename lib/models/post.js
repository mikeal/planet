/*
post model for mongoose
 */

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

postSchema.plugin(mongoosastic);
mongoose.model('postModel', postSchema);
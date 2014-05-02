/*
post model for mongoose
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
    title: String,
    link: { type: String, index: true },
    displayDate: { type: String, index: true },
    author: String,
    isoTimeStamp: String,
    content: String,
    tags: Array
});

mongoose.model('postModel', postSchema);
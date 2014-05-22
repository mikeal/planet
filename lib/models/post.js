/*
post model for mongoose
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({
    title: String,
    link: { type: String, index: true, required: true, unique: true },
    displayDate: { type: Date, index: true, required:true },
    author: String,
    isoTimeStamp: String,
    content: String,
    tags: Array
});

mongoose.model('postModel', postSchema);
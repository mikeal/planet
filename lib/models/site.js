/*
site model for mongoose
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var siteSchema = new Schema({
    name: String,
    url: { type: String, index: true, required: true, unique: true }
});

mongoose.model('site', siteSchema);
/*
site model for mongoose
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var siteSchema = new Schema({
    name: String,
    url: String
});

mongoose.model('site', siteSchema);
/*
site model for mongoose
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var siteSchema = new Schema({
    name: { type: String, index: true, required: true, unique: true },
    url: { type: String, index: true, required: true, unique: true }
});

mongoose.model('siteModel', siteSchema);
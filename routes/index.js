var express = require('express');
var router = express.Router();
var feedreader = require('../lib/feedreader.js');

/* GET home page. */
router.get('/', function(req, res) {
    feedreader.run(function(rss){  
        console.log(rss);
        res.render('index', { data: rss });
    }); 
});

module.exports = router;

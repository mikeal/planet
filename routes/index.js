var express = require('express');
var router = express.Router();
var feedreader = require('../lib/feedreader.js');

/* GET home page. */
router.get('/', function(req, res) {
  var db = req.db;
  var collection = db.get('usercollection');
  
  feedreader.run(collection, function(rss, docs) {
    /*
    FOR USE LATER - req.query will give you the url query. 
    I plan on using the query for multiple pages - aka first 10 articles on 1 page, then next 10 on 2nd page...so on
    Add a simple if statement to sort through them
     */
    
    console.log(docs);
    res.render(
      'index', {data: rss, test: docs}
    );
      
  });
});




module.exports = router;
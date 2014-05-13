var express = require('express');
var router = express.Router();
var feedreader = require('../lib/feedreader.js');

/* GET home page. */
router.get('/', function(req, res) {

  
  feedreader.run(function(posts) {
    /*
    FOR USE LATER - req.query will give you the url query. 
    I plan on using the query for multiple pages - aka first 10 articles on 1 page, then next 10 on 2nd page...so on
    Add a simple if statement to sort through them
     */
    res.render(
      'test', {data: posts}
    );
      
  });
});




module.exports = router;
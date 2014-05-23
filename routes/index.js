var express = require('express');
var router = express.Router();
var feedreader = require('../lib/feedreader.js');

/* GET home page. */
router.get('/', function(req, res) {

  if(req.query.id){
      console.log(('Here is the id of the document the user is trying to access: ' + req.query.id));
      feedreader.getArticleById(req.query.id, function(post){
        var article = [];
        article[0] = post;
        res.render(
          'singleArticle', {data: article}
        );
      });
  }
  else{
    feedreader.run(function(posts, sitesArray) {    
      res.render(
        'index', {data: posts, sitesList: sitesArray}
      );
        
    });
  }
});




module.exports = router;
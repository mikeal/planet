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
        'singleArticle', {data: article, uri: 'http://www.planetnodejs.com/article/'+post.title}
      );
    });
  }
  else if(req.query.searchString){
    console.log(('Here is the users search: ' + req.query.searchString));
    feedreader.getArticlesBySearchString(req.query.searchString, function(results){
      
      res.render(
        'search', {data: results, uri: 'http://www.planetnodejs.com/search/' + req.query.searchString}
      );
    });
  }
  else {
    feedreader.run(function(posts) {    
      res.render(
        'index', {data: posts, uri: 'http://www.planetnodejs.com'}
      );
        
    });
  }
});




module.exports = router;
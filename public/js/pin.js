$(document).ready(function() {
    function fixDiv() {
      var $cache = $('#getFixed'); 
      if ($(window).scrollTop() > 100) 
        $cache.css({'position': 'fixed', 'top': '100px'}); 
      else
        $cache.css({'position': 'relative', 'top': 'auto'});
    }
    $(window).scroll(fixDiv);
    fixDiv();
});
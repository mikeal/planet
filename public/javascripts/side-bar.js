$( document ).ready(function() {
  setUpMobileLayout();
  $('.close-menu').click(function(event) { //this should eventually be REMOVED
    $('#nav').addClass('hide-nav');
  });
  $('#open-side-bar').click(function(event) {
    if ($('#nav').hasClass('hide-nav')) {
      console.log('side-bar is currently hidden. showing now');
      $('#nav').removeClass('hide-nav');
    } else{
      console.log('side bar shown. hiding now');
      $('#nav').addClass('hide-nav');
    };
  });

  $('#nav-option-articles').click(function(event) {
    showArticles();
    hideSites();
  });
  $('#nav-option-sites').click(function(event) {
    showSites();
    hideArticles();
  });
});

function setUpMobileLayout(){
  showArticles();
  hideSites();
}

function showArticles(){
  if ($('#posts').hasClass('hide-me')){
    $('#posts').removeClass('hide-me');
  }
}
function showSites(){
  if ($('#links').hasClass('hide-me')){
    $('#links').removeClass('hide-me');
  }

}
function hideArticles(){
  $('#posts').addClass('hide-me');
}
function hideSites(){
  $('#links').addClass('hide-me');
}
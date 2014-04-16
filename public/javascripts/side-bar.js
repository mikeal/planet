$( document ).ready(function() {
  $('.close-menu').click(function(event) {
    $('#nav').addClass('hide-nav');
  });
  $('#open-side-bar').click(function(event) {
    $('#nav').removeClass('hide-nav');
  });
});
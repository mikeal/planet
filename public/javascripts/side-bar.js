$( document ).ready(function() {
  $('.close-menu').click(function(event) {
    $('#content').removeClass('slide-content-over');
    $('#nav').addClass('hide-nav');
  });
  $('.hamburger').click(function(event) {
    $('#content').addClass('slide-content-over');
    $('#nav').removeClass('hide-nav');
  });
});
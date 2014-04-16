$( document ).ready(function() {
  $('.close-menu').click(function(event) {
<<<<<<< HEAD
    $('#nav').addClass('hide-nav');
  });
  $('#open-side-bar').click(function(event) {
=======
    $('#content').removeClass('slide-content-over');
    $('#nav').addClass('hide-nav');
  });
  $('.hamburger').click(function(event) {
    $('#content').addClass('slide-content-over');
>>>>>>> 8ec3d6db2cde71ef24d8b9ae7319e0d1ba3ce3e9
    $('#nav').removeClass('hide-nav');
  });
});
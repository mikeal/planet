$('.show-me-more').click(function() {
    console.log('show-me was clicked');
    console.log($(this));
    var inDepth = $(this).siblings('.in-depth');
    console.log(inDepth);
    inDepth.removeClass('hide-me');
    $(this).addClass('hide');
});
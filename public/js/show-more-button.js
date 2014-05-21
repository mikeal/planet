$('.post-title').click(function() {
    var content = $(this).closest('.post-content').find('.in-depth');
    if($(content).hasClass('hide-me')){
        $(content).removeClass('hide-me');
    }
    else if( !$(content).hasClass('hide-me')){
        $(content).addClass('hide-me');
    }

});







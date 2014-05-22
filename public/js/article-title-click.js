$('.post-title').click(function() {
    $('.in-depth').addClass('hide');
    var content = $(this).closest('.post').find('.in-depth');
    if($(content).hasClass('hide')){
        $(content).removeClass('hide');
    }
    else if( !$(content).hasClass('hide')){
        $(content).addClass('hide');
    }

});







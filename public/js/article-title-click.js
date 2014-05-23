$('.post-title').click(function() {
    for (var i = 0; i < $('.post-title').length; i++) {
        if( $(this) != $('.post-title')[i]){
            $('.post-title')[i].addClass('hide');
        }
    };
    var content = $(this).closest('.post').find('.in-depth');
    if($(content).hasClass('hide')){
        $(content).removeClass('hide');
    }
    else if( !$(content).hasClass('hide')){
        $(content).addClass('hide');
    }

});







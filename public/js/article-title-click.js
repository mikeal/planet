$('.post-title').click(function() {
    // var postTitles = $('.post-title');
    // console.log(postTitles[0]);
    // for (var i = 0; i < $(postTitles[i]).length; i++) {
    //     if( $(this) != $(postTitles[i])){
    //         $(postTitles[i]).closest('.post').find('.in-depth').addClass('hide');
    //     }
    // };
    var content = $(this).closest('.post').find('.in-depth');
    if($(content).hasClass('hide')){
        $(content).removeClass('hide');
    }
    else if( !$(content).hasClass('hide')){
        $(content).addClass('hide');
    }
});







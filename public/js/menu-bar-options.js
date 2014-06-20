var navOptions = [$('#nav-option-articles'), $('#nav-option-sites')];

$('#nav-option-articles').click(function(event) {
    showArticles();
    makeActive($('#nav-option-articles'));
    hideNav();
});
$('#nav-option-sites').click(function(event) {
    showSites();
    makeActive($('#nav-option-sites'));
    hideNav();
});

function showArticles () {
    if( $('#articles').hasClass('hidden')) {
        $('#articles').removeClass('hidden');
    }
    $('#sites').addClass('hidden');
    
}
function showSites () {
    if( $('#sites').hasClass('hidden')) {
        $('#sites').removeClass('hidden');
    }
    if( $('#sites').hasClass('hidden-xs')) {
        $('#sites').removeClass('hidden-xs');
    }
    $('#articles').addClass('hidden');
    
}
function makeActive(activeElement){
    for (var i = 0; i < navOptions.length; i++) {        
        $(navOptions[i]).closest('li').removeClass('active');       
    }

    $(activeElement).closest('li').addClass('active');
}
function hideNav(){
    $('.navbar-toggle').trigger('click'); //this is dirty, but it simulates the click of hamburger -- much easier than doing it manually
}
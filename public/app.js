$('#navButton').click((event) => {
  window.location.href = '/';
});
$('.show-form').click((event) => {
  $('.show-form').siblings('form').slideToggle(666);
});

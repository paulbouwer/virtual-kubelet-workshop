function getWorkItemInfo() {
  $.ajax({
    type: "GET",
    url: "http://localhost:8080/workitems"
  }).then(function(data) {
    $('.workitem-total').html(data.total);
    $('.workitem-totalProcessed').html(data.totalProcessed);
    $('.workitem-remaining').html(data.remaining);
    $('.workitem-processingRate').html(data.processingRate);
  });
}
setInterval(getWorkItemInfo, 2000);

function resetWorkItems() {
  $("#resetButton").prop('disabled', true);
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/reset"
  }).done(function(data) {
    $("#resetButton").prop('disabled', false);
  });
}

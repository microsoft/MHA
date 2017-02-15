var overlay = null;
var spinner = null;
var viewModel = null;

/*
$(document).ready(function () {
  debugOut('Initalizing...');
  initializeFabric();
  updateStatus(ImportedStrings.mha_loading);
});
*/
Office.initialize = function () {
  $(document).ready(function () {
    debugOut('Initalizing...');
    viewModel = new HeaderModel();
    initializeFabric();
    updateStatus(ImportedStrings.mha_loading);
    sendHeadersRequest();
  });
};

function initializeFabric() {
  var OverlayComponent = document.querySelector('.ms-Overlay');
  // Override click so user can't dismiss overlay
  OverlayComponent.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
  });
  overlay = new fabric['Overlay'](OverlayComponent);

  var SpinnerElement = document.querySelector('.ms-Spinner');
  spinner = new fabric['Spinner'](SpinnerElement);
  spinner.stop();

  var CommandBarElements = document.querySelectorAll('.ms-CommandBar');
  for (var i = 0; i < CommandBarElements.length; i++) {
    new fabric['CommandBar'](CommandBarElements[i]);
  }

  var CommandButtonElements = document.querySelectorAll('.ms-CommandButton');
  for (var i = 0; i < CommandButtonElements.length; i++) {
    new fabric['CommandButton'](CommandButtonElements[i]);
  }

  // Show summary by default
  $('.header-view[data-content=\'summary-view\']').show();

  // Wire up click events for nav buttons
  $('#nav-bar .ms-CommandButton').click(function(){
    // Remove active from current active
    $('#nav-bar .is-active').removeClass('is-active');
    // Add active class to clicked button
    $(this).addClass('is-active');

    // Get content marker
    var content = $(this).attr('data-content');
    // Hide sub-views
    $('.header-view').hide();
    $('.header-view[data-content=\'' + content + '\']').show();
  });
}

function getHeadersComplete(headers) {
  viewModel.parseHeaders(headers);
  buildViews();
}

function buildViews() {
  // Build summary view
  var summaryList = $('.summary-list');

  for (var i = 0 ; i < viewModel.summary.summaryRows.length ; i++) {
    if (viewModel.summary.summaryRows[i].get()) {
      var headerName = $('<div/>')
        .addClass('ms-font-s')
        .addClass('ms-fontWeight-semibold')
        .text(viewModel.summary.summaryRows[i].label)
        .appendTo(summaryList);

      var headerVal = $('<div/>')
        .addClass('code-box')
        .appendTo(summaryList);

      var pre = $('<pre/>').appendTo(headerVal);
      var code = $('<code/>')
        .text(viewModel.summary.summaryRows[i].get())
        .appendTo(pre);
    }
  }

  // Build received view

  // Build antispam view
  var antispamList = $('.antispam-list');

  // Forefront
  if (viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows.length > 0) {
    $('<div/>')
      .addClass('ms-font-m')
      .text('Forefront Antispam Report')
      .appendTo(antispamList);

    $('<hr/>').appendTo(antispamList);

    var table = $('<table/>')
      .addClass('ms-Table')
      .addClass('ms-Table--fixed')
      .addClass('spam-report')
      .appendTo(antispamList);

    var tbody = $('<tbody/>')
      .appendTo(table);

    for (var i = 0 ; i < viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows.length ; i++) {
      if (viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i].get()) {
        var row = $('<tr/>').appendTo(tbody);

        $('<td/>')
          .text(viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i].label)
          .appendTo(row);

        var linkVal = mapHeaderToURL(viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i].url,
          viewModel.forefrontAntiSpamReport.forefrontAntiSpamRows[i].get());
        $('<td/>')
          .html(linkVal)
          .appendTo(row);
      }
    }
  }

  // Microsoft
  if (viewModel.antiSpamReport.antiSpamRows.length > 0) {
    $('<div/>')
      .addClass('ms-font-m')
      .text('Microsoft Antispam Report')
      .appendTo(antispamList);

    $('<hr/>').appendTo(antispamList);

    var table = $('<table/>')
      .addClass('ms-Table')
      .addClass('ms-Table--fixed')
      .addClass('spam-report')
      .appendTo(antispamList);

    var tbody = $('<tbody/>')
      .appendTo(table);

    for (var i = 0 ; i < viewModel.antiSpamReport.antiSpamRows.length ; i++) {
      if (viewModel.antiSpamReport.antiSpamRows[i].get()) {
        var row = $('<tr/>').appendTo(tbody);

        $('<td/>')
          .text(viewModel.antiSpamReport.antiSpamRows[i].label)
          .appendTo(row);

        var linkVal = mapHeaderToURL(viewModel.antiSpamReport.antiSpamRows[i].url,
          viewModel.antiSpamReport.antiSpamRows[i].get());
        $('<td/>')
          .html(linkVal)
          .appendTo(row);
      }
    }
  }

  // Build other view
  var otherList = $('.other-list');

  for (var i = 0 ; i < viewModel.otherHeaders.otherRows.length ; i++) {
    if (viewModel.otherHeaders.otherRows[i].value) {
      var headerName = $('<div/>')
        .addClass('ms-font-s')
        .addClass('ms-fontWeight-semibold')
        .text(viewModel.otherHeaders.otherRows[i].header)
        .appendTo(otherList);

      if (viewModel.otherHeaders.otherRows[i].url) {
        headerName.html(viewModel.otherHeaders.otherRows[i].url);
      }

      var headerVal = $('<div/>')
        .addClass('code-box')
        .appendTo(otherList);

      var pre = $('<pre/>').appendTo(headerVal);
      var code = $('<code/>')
        .text(viewModel.otherHeaders.otherRows[i].value)
        .appendTo(pre);
    }
  }

  // Initialize any fabric lists added
  var ListElements = document.querySelectorAll(".ms-List");
  for (var i = 0; i < ListElements.length; i++) {
    new fabric['List'](ListElements[i]);
  }

  var ListItemElements = document.querySelectorAll(".ms-ListItem");
  for (var i = 0; i < ListItemElements.length; i++) {
    new fabric['ListItem'](ListItemElements[i]);
  }
}

function updateStatus(message) {
  $('.status-message').text(message);
  spinner.start();
  overlay.show();
}

function hideStatus() {
  spinner.stop();
  overlay.hide();
}

function showError(message) {
  $('#error-display .ms-MessageBar-text').text(message);
  $('#error-display').show();
}

function debugOut(message) {
  var oldText = $('.debug-print').text();
  $('.debug-print').text(oldText + '\r\n' + message);
}
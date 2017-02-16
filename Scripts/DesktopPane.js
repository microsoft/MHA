var overlay = null;
var spinner = null;
var viewModel = null;

/*
$(document).ready(function () {
  debugOut('Initalizing...');
  initializeFabric();
  //updateStatus(ImportedStrings.mha_loading);
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

  var ButtonElement = document.querySelector("#orig-header-btn");
  new fabric['Button'](ButtonElement, function() {
    var btnIcon = $(this).find('.ms-Icon');
    if (btnIcon.hasClass('ms-Icon--Add')) {
      $('#original-headers').show();
      btnIcon.removeClass('ms-Icon--Add').addClass('ms-Icon--Remove');
    } else {
      $('#original-headers').hide();
      btnIcon.removeClass('ms-Icon--Remove').addClass('ms-Icon--Add');
    }
  });

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

  // Save original headers and enable button
  $('#orig-header-btn').removeAttr('disabled');
  $('#original-headers code').text(viewModel.originalHeaders);

  // Build received view
  var receivedList = $('.received-list');

  if (viewModel.receivedHeaders.receivedRows.length > 0) {
    var list = $('<ul/>')
      .addClass('ms-List')
      .appendTo(receivedList);

    for (var i = 0; i < viewModel.receivedHeaders.receivedRows.length; i++) {

      var listItem = $('<li/>')
        .addClass('ms-ListItem')
        .addClass('ms-ListItem--document')
        .appendTo(list);

      if (viewModel.receivedHeaders.receivedRows[i].delaySort < 0) {
        var title = $('<span/>')
          .addClass('ms-ListItem-primaryText')
          .text('From: ' + viewModel.receivedHeaders.receivedRows[i].from)
          .appendTo(listItem);

        $('<span/>')
          .addClass('ms-ListItem-secondaryText')
          .text('To: ' + viewModel.receivedHeaders.receivedRows[i].by)
          .appendTo(listItem);
      } else {
        var wrap = $('<div/>')
          .addClass('progress-icon')
          .appendTo(listItem);

        var iconbox = $('<div/>')
          .addClass('ms-font-xxl')
          .addClass('down-icon')
          .appendTo(wrap);

        $('<i/>')
          .addClass('ms-Icon')
          .addClass('ms-Icon--Down')
          .appendTo(iconbox);

        var delay = $('<div/>')
          .addClass('ms-ProgressIndicator')
          .appendTo(wrap);

        var bar = $('<div/>')
          .addClass('ms-ProgressIndicator-itemProgress')
          .appendTo(delay);

        $('<div/>')
          .addClass('ms-ProgressIndicator-progressTrack')
          .appendTo(bar);

        var width = 1.8 * viewModel.receivedHeaders.receivedRows[i].percent;

        $('<div/>')
          .addClass('ms-ProgressIndicator-progressBar')
          .css('width', width)
          .appendTo(bar);

        var delayText = viewModel.receivedHeaders.receivedRows[i].delay ?
          viewModel.receivedHeaders.receivedRows[i].delay : '';

        $('<div/>')
          .addClass('ms-ProgressIndicator-itemDescription')
          .text(viewModel.receivedHeaders.receivedRows[i].delay)
          .appendTo(delay);

        $('<span/>')
          .addClass('ms-ListItem-secondaryText')
          .text('To: ' + viewModel.receivedHeaders.receivedRows[i].by)
          .appendTo(listItem);
      }

      $('<div/>')
        .addClass('ms-ListItem-selectionTarget')
        .appendTo(listItem);

      // Callout
      var callout = $('<div/>')
        .addClass('ms-Callout is-hidden')
        .appendTo(listItem);

      var calloutMain = $('<div/>')
        .addClass('ms-Callout-main')
        .appendTo(callout);

      var calloutHeader = $('<div/>')
        .addClass('ms-Callout-header')
        .appendTo(calloutMain);

      $('<p/>')
        .addClass('ms-Callout-title')
        .text('Hop Details')
        .appendTo(calloutHeader);

      var calloutInner = $('<div/>')
        .addClass('ms-Callout-inner')
        .appendTo(calloutMain);

      var calloutContent = $('<div/>')
        .addClass('ms-Callout-content')
        .appendTo(calloutInner);

      $('<p/>')
        .addClass('ms-Callout-subText')
        .text('From: ' + viewModel.receivedHeaders.receivedRows[i].from)
        .appendTo(calloutContent);

      $('<p/>')
        .addClass('ms-Callout-subText')
        .text('To: ' + viewModel.receivedHeaders.receivedRows[i].by)
        .appendTo(calloutContent);

      $('<p/>')
        .addClass('ms-Callout-subText')
        .text('Time: ' + viewModel.receivedHeaders.receivedRows[i].date)
        .appendTo(calloutContent);

      if (viewModel.receivedHeaders.receivedRows[i].with) {
        $('<p/>')
          .addClass('ms-Callout-subText')
          .text('Type: ' + viewModel.receivedHeaders.receivedRows[i].with)
          .appendTo(calloutContent);
      }

      if (viewModel.receivedHeaders.receivedRows[i].id) {
        $('<p/>')
          .addClass('ms-Callout-subText')
          .text('ID: ' + viewModel.receivedHeaders.receivedRows[i].id)
          .appendTo(calloutContent);
      }

      if (viewModel.receivedHeaders.receivedRows[i].for) {
        $('<p/>')
          .addClass('ms-Callout-subText')
          .text('For: ' + viewModel.receivedHeaders.receivedRows[i].for)
          .appendTo(calloutContent);
      }

      if (viewModel.receivedHeaders.receivedRows[i].via) {
        $('<p/>')
          .addClass('ms-Callout-subText')
          .text('Via: ' + viewModel.receivedHeaders.receivedRows[i].via)
          .appendTo(calloutContent);
      }
    }
  }

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

    // Init corresponding callout
    var calloutElement = ListItemElements[i].querySelector('.ms-Callout');
    new fabric['Callout'](calloutElement, ListItemElements[i], 'right');
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
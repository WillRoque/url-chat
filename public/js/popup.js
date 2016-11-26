const socketIO = io('http://localhost:3000/');
var tabUrl;

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to get the current active tab
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, (tabs) => {
    var tab = tabs[0];
    var url = tab.url;

    console.log('You are in the chat of the url: ' + url);

    callback(url);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl((url) => {
    tabUrl = url;
    socketIO.emit('join room', url);
  });
});

$('form').submit(function () {
  console.log('sending message: ' + $('#m').val());
  socketIO.emit('chat message', {
    room: tabUrl,
    message: $('#m').val()
  });
  $('#m').val('');
  return false;
});

socketIO.on('chat message', function (msg) {
  console.log('receiving message: ' + msg);
  $('#messages').append($('<li>').text(msg));
});

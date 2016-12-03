const socketIO = io('http://localhost:3000/');
var tabUrl;

/**
 * Joins the chat room of the URL of the current tab
 */
document.addEventListener('DOMContentLoaded', () => {
  getCurrentTabUrl((url) => {
    tabUrl = url;
    socketIO.emit('joinRoom', url);
  });
});

/**
 * Gets the URL of the current active tab.
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

/**
 * Sends the message contained in the 'message-input' to the server
 */
function sendMessage() {
  var message = document.getElementById('message-input').value;

  if (message === '') {
    return;
  }

  console.log('sending message: ' + message);

  socketIO.emit('chatMessage', {
    room: tabUrl,
    message: message
  });

  document.getElementById('message-input').value = '';
}

/**
 * Receives a chat message from the server
 */
socketIO.on('chatMessage', function (msg) {
  console.log('receiving message: ' + msg);
  var li = document.createElement('li');
  li.appendChild(document.createTextNode(msg));
  document.getElementById('messages').appendChild(li);
});

/**
 * Sends a chat message to the server when the user
 * clicks on the send button
 */
document.getElementById('send').onclick = sendMessage;

/**
 * Sends a chat message to the server when the user
 * presses enter in the input field
 */
document.getElementById('message-input').onkeypress = (event) => {
  if (event.keyCode === 13) {
    sendMessage();
  }
}

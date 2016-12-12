const socketIO = io('http://localhost:3000/');
var userId;
var tabUrl;
var lastSender;

/**
 * Joins the chat room of the URL of the current tab
 */
document.addEventListener('DOMContentLoaded', () => {
  getUserId();
  getCurrentTabUrl((url) => {
    tabUrl = url;
    socketIO.emit('joinRoom', url);
    document.getElementById('room-stats').innerHTML = '1 people in this room';
  });
  document.getElementById('message-input').focus();
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
  console.log('userId: ' + userId);

  addMessage(message, 'myself');

  socketIO.emit('chatMessage', {
    room: tabUrl,
    sender: userId,
    message: message
  });

  document.getElementById('message-input').value = '';
}

/**
 * Receives a chat message from the server
 */
socketIO.on('chatMessage', function (data) {
  console.log('receiving message: ' + data);

  addMessage(data.message, data.sender);
});

/**
 * Adds a message to the chat, either it's been received or sent
 * 
 * @param message - message received/sent
 * @param sender - if the message was sent by this client,
 *   adds the sender's name on top of the message
 */
function addMessage(message, sender) {
  var li = document.createElement('li');

  if (lastSender && lastSender === sender) {
    li.classList.add('continuous-message');
  }

  lastSender = sender;

  var messageWrapper = document.createElement('div');
  messageWrapper.className = 'message-wrapper';

  if (sender && sender !== 'myself') {
    var messageSender = document.createElement('div');
    messageSender.className = 'message-sender';
    messageSender.innerHTML = sender + ':';
    messageWrapper.appendChild(messageSender);
  } else {
    messageWrapper.classList.add('my-message');
  }

  var messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.appendChild(document.createTextNode(message));
  messageWrapper.appendChild(messageDiv);

  li.appendChild(messageWrapper);

  document.getElementById('messages').appendChild(li);
}

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

/**
 * Gets the identification of the user and sets it to the userId var.
 * If this is the first time retrieving it, a random identification is
 * generated and stored at chrome storage.
 * 
 * @param {function(string)} callback - called when the user's
 *   Id is retrieved.
 */
function getUserId() {
  chrome.storage.sync.get('userId', (items) => {
    if (items.userId) {
      userId = items.userId;
    } else {
      socketIO.emit('generateUserId', (newUserId) => {
        console.log('server retornou novo id: ' + newUserId);
        userId = newUserId;
        chrome.storage.sync.set({ 'userId': newUserId });
      });
    }
  });
}
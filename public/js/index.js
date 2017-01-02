const socketIO = io('http://localhost:3000/');
var user = { id: '', name: '' };
var tabUrl;
var lastSenderId;

/**
 * Joins the chat room of the URL of the current tab.
 */
document.addEventListener('DOMContentLoaded', () => {
  getUserId();
  getCurrentTabUrl((url) => {
    tabUrl = url;
    socketIO.emit('joinRoom', url);
  });
  document.getElementById('message-input').focus();
});

/**
 * When this client enters a room,
 * receives the user count and the last
 * messages sent to this room.
 */
socketIO.on('login', (data) => {
  changeUserCounter(data.userCount);

  for (var i = 0; i < data.messages.length; i++) {
    addMessage(data.messages[i].message, data.messages[i].sender, data.messages[i].timestamp);
  }
});

/**
 * Receives a chat message from the server.
 */
socketIO.on('chatMessage', (data) => {
  console.log('receiving message: ' + data);
  addMessage(data.message, data.sender, data.timestamp);
});

/**
 * Called when some other user changes his name,
 * so it also changes his name shown in his messages
 * on other users computers.
 */
socketIO.on('changeUserName', (data) => {
  changeUserName(data.user.id, data.user.name);
});

/**
 * Changes the user counter when some other
 * user joined or left the room.
 */
socketIO.on('updateUserCounter', (data) => {
  changeUserCounter(data.userCount);
});

/**
 * Changes the user counter.
 * 
 * @param userCount - the amount of users to be showed on the counter.
 */
function changeUserCounter(userCount) {
  document.getElementById('room-users-counter').innerHTML = userCount + ' users in this room';
}

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
 * Sends the message contained in the 'message-input' to the server.
 */
function sendMessage() {
  var message = document.getElementById('message-input').value;

  if (message === '') {
    return;
  }

  addMessage(message, user.id, Date.now());

  socketIO.emit('chatMessage', {
    room: tabUrl,
    senderId: user.id,
    senderName: user.name,
    message: message
  });

  document.getElementById('message-input').value = '';
}

/**
 * Adds a message to the chat, either it's been received or sent.
 * 
 * @param message - message received/sent.
 * @param sender - if the message was sent by this client,
 *   adds the sender's name on top of the message.
 */
function addMessage(message, sender, timestamp) {
  var li = document.createElement('li');

  if (lastSenderId && lastSenderId === sender) {
    li.classList.add('continuous-message');
  }

  lastSenderId = sender.id;

  var messageWrapper = document.createElement('div');
  messageWrapper.className = 'message-wrapper';

  // Adds the message time
  var messageTime = document.createElement('div');
  messageTime.classList.add('message-time');
  messageTime.innerHTML = new Date(timestamp).toLocaleString();
  messageWrapper.appendChild(messageTime);

  // Adds the message sender
  if (sender && sender.id && sender.id !== user.id) {
    var messageSenderWrapper = document.createElement('div');
    messageSenderWrapper.classList.add('message-sender');

    var messageSenderId = document.createElement('div');
    messageSenderId.classList.add('message-sender-id');
    messageSenderId.innerHTML = sender.id + ':';

    var messageSenderName = document.createElement('div');
    messageSenderName.classList.add('message-sender-name');

    if (sender.name) {
      messageSenderId.classList.add('invisible');
      messageSenderName.innerHTML = sender.name + ':';
    }

    messageSenderWrapper.appendChild(messageSenderId);
    messageSenderWrapper.appendChild(messageSenderName);
    messageWrapper.appendChild(messageSenderWrapper);
    messageTime.innerHTML = messageTime.innerHTML + ' - ';
  } else {
    messageWrapper.classList.add('my-message');
    messageTime.innerHTML = messageTime.innerHTML + ':';
  }

  // Adds the message itself
  var messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.appendChild(document.createTextNode(message));
  messageWrapper.appendChild(messageDiv);

  li.appendChild(messageWrapper);

  var messages = document.getElementById('messages');
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

/**
 * Gets the identification of the user and sets it into the user.id var.
 * If this is the first time retrieving it, a random identification is
 * generated and stored at chrome storage.
 */
function getUserId() {
  chrome.storage.sync.get('user', (items) => {
    if (items.user) {
      user = items.user;

      var userDiv = document.getElementById('user');
      userDiv.innerHTML = user.name ? user.name : user.id;
      document.getElementById('welcome-message').innerHTML = (user.name ? 'Hello ' : 'Hello user ') + userDiv.outerHTML;
      setUserDivClickable();
    } else {
      socketIO.emit('generateUserId', (newUserId) => {
        console.log('server retornou novo id: ' + newUserId);

        var userDiv = document.getElementById('user');
        userDiv.innerHTML = newUserId;
        document.getElementById('welcome-message').innerHTML = 'Hello user ' + userDiv.outerHTML;
        setUserDivClickable();

        user = {
          id: newUserId,
          name: ''
        };

        chrome.storage.sync.set({ 'user': user });
      });
    }
  });
}

/**
 * Changes the name of the user
 * 
 * @param userId - the id of the user that changed his name.
 * @param userName - the new name of the user that changed his name.
 */
function changeUserName(userId, userName) {
  if (user.id === userId) {
    var userDiv = document.getElementById('user');
    userDiv.innerHTML = userName;
    document.getElementById('welcome-message').innerHTML = 'Hello ' + userDiv.outerHTML;
    setUserDivClickable();
  }

  var senders = document.getElementById('messages').getElementsByClassName('message-sender');
  Array.prototype.forEach.call(senders, (sender) => {
    var senderIdDiv = sender.getElementsByClassName('message-sender-id')[0];

    if (senderIdDiv.innerHTML.startsWith(userId)) {
      senderIdDiv.classList.add('invisible');
      var senderNameDiv = sender.getElementsByClassName('message-sender-name')[0];
      senderNameDiv.innerHTML = userName + ':';
    }
  });
}

/**
 * Sends the name of the user to the server and
 * saves it in the chrome's storage.
 */
function changeMyUserName() {
  var name = document.getElementById('name-input').value;
  if (!name) {
    document.getElementById('name-input-messge').innerHTML = 'You should write your name in the input field above!';
    return;
  }

  user.name = name;
  socketIO.emit('changeUserName', {
    room: tabUrl,
    userId: user.id,
    userName: user.name
  });

  changeUserName(user.id, user.name);
  chrome.storage.sync.set({ 'user': user });

  document.getElementById('name-input').value = '';
  document.getElementById('name-input-wrapper').style.visibility = 'hidden';
}

/**
 * Sets the 'user' div clickable, so the user can
 * change it's name. The reason why it's not done
 * directly without a function is because the 'user'
 * div is changed when the user's name or id is loaded.
 */
function setUserDivClickable() {
  document.getElementById('user').onclick = () => {
    document.getElementById('name-input-wrapper').style.visibility = 'visible';
    document.getElementById('name-input').focus();
  }
}

/**
 * Hides the "Write your name" input.
 */
document.getElementById('name-input-close').onclick = () => {
  document.getElementById('name-input-wrapper').style.visibility = 'hidden';
}

/**
 * Sends the name of the user to the server and
 * saves it in the chrome's storage when the user
 * clicks on the OK button.
 */
document.getElementById('name-input-ok').onclick = (event) => {
  changeMyUserName();
}

/**
 * Sends the name of the user to the server and
 * saves it in the chrome's storage when the user
 * presses enter on the name input field.
 */
document.getElementById('name-input').onkeypress = (event) => {
  if (event.keyCode === 13) {
    changeMyUserName();
  }
}

/**
 * Sends a chat message to the server when the user
 * clicks on the send button.
 */
document.getElementById('send').onclick = sendMessage;

/**
 * Sends a chat message to the server when the user
 * presses enter in the input field.
 */
document.getElementById('message-input').onkeypress = (event) => {
  if (event.keyCode === 13) {
    sendMessage();
  }
}
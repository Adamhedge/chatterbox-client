
var app = {
  server: 'https://api.parse.com/1/classes/chatterbox',
  messages: {},
  chatBox: document.getElementById("chats"),

  init: function() {
    return true;
  },

  setScroll: function(){
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  },

  fetch: function(){
    var createHTMLMessage = function(obj) {
      var message = htmlEntities(obj.text);
      var user    = htmlEntities(obj.username);
      var result =  "<div id=\"" + user + "\" class=\"chatCount\"> \
                      </div> \
                    <div class=\"chat\"> \
                      <span class=\"username\" style=\"color:" + colorify(user) + "\">" + user + "</span>: " + message + " \
                      <span class=\"timestamp\">" + moment(obj.createdAt).format("LLL") + "</span> \
                    </div>";

      if(lastMessage){
        console.log(lastMessage.text + " " + obj.text);
      }
      //console.log(!lastMessage || lastMessage.text !== obj.text);
      if(lastMessage && (lastMessage.text === obj.text && lastMessage.roomname === obj.roomname)){
        lastMessage.count++;
        console.log("Found a duplicate: "+ lastMessage.text);
        $('#'+user).children().last().addClass("content").text(lastMessage.count);
      } else{
        lastMessage = obj;
        lastMessage.count = 1;
        $("#chats").append(result);
      }
      //console.log($('#chats').children().last().html() === result);
      return result;
    }

    var results;
    var lastMessage;
    //fetch messages
    var self = this;
    $.ajax({
      url: this.server,
      type: 'GET',
      success: function (data) {
        results = data.results;
        for(var i = results.length - 1; i >= 0; i --) {
          if(!(results[i].objectId in self.messages)) {
            self.messages[results[i].objectId] = results[i];
            createHTMLMessage(results[i]);
          }
        }
        self.setScroll();
      },
      error: function (data) {
        console.error('chatterbox: Failed to get messages');
      }
    });

    return true;
  },

  send: function(obj) {
    if (obj !== undefined) {
      var userName = obj.username;
      var msg = obj.text;
      var room = obj.roomname;
    } else {
      var userName = window.location.search;
      userName = htmlEntities(userName.substring(userName.indexOf('=')+1));
      var msg = htmlEntities($("#message").val());
      var room = "blah";
    }

    $.ajax({
      // This is the url you should use to communicate with the parse API server.
      url: this.server,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
          username: userName,
          text: msg,
          roomname: room

      }),
      success: function (data) {
        console.log('chatterbox: Message sent');
        app.fetch();
      },
      error: function (data) {
        console.error('chatterbox: Failed to send message');
      }
    });
    $("#message").val("");

  },

  clearMessages: function(){
    $("#chats").html("");
  },

  addMessage: function(message){
    this.send(message);
  }

};

$('#send').click(function(){
  app.send();
  e.preventDefault();
  app.setScroll();
});

$('#message').keypress(function (e) {
  if (e.which == 13) {

    app.send();
    e.preventDefault();
    app.setScroll();
  }
});

$("#send").submit(function(){
  app.send();
  e.preventDefault();
  app.setScroll();
});


$(document).ready(function(){
  app.init();
  app.fetch();
});

window.setInterval(function() {
  if (app.chatBox.scrollHeight-app.chatBox.scrollTop <= 500) {
    app.fetch();
  }
}, 1000);

var htmlEntities = function(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

var colorify = function(name) {
  return "#" + md5(name).match(/(.{2})/g).slice(0, 3).join("");
}

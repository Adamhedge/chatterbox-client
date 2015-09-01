
var app = {
  server: 'https://api.parse.com/1/classes/chatterbox',
  messages: {},
  chatBox: document.getElementById("chats"),
  room: null,

  init: function() {
    var self = this;
    this.fetch(function() {
      self.display("<b>Welcome to Chatterbox!<b>");
      self.display("You are currently in the <b>general area</b>.");
      self.display("Type <b>/list</b> to view all available rooms.");
      self.display("Please type <b>/join [room]</b> to join a specific room or create a new room.");
      self.display("You can return to the general area by leaving a room with <b>/leave</b>.");
      self.display("Type <b>/help</b> to view all available commands.");
      self.setScroll();
    });
    return true;
  },

  setScroll: function(){
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  },

  fetch: function(cb){
    var createHTMLMessage = function(obj) {
      var message = htmlEntities(obj.text);
      var user    = htmlEntities(obj.username);
      var room = obj.roomname;
      if (room === undefined || room === null || room === "") {
        room = "*";
      }

      var result =  "<div id=\"" + user + "\" class=\"chatCount\"> \
                      </div> \
                    <div class=\"chat\"> \
                      [" + room + "] <span class=\"username\" style=\"color:" + colorify(user) + "\">" + user + "</span>: " + message + " \
                      <span class=\"timestamp\">" + moment(obj.createdAt).format("LLL") + "</span> \
                    </div>";

      if(lastMessage){
        console.log(lastMessage.text + " " + obj.text);
      }
      //console.log(!lastMessage || lastMessage.text !== obj.text);
      if(lastMessage && (lastMessage.text === obj.text && lastMessage.roomname === obj.roomname)){
        lastMessage.count++;
        console.log("Found a duplicate: "+ user + " " + lastMessage.text);
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
            //console.log(results[i].roomname, self.room);
            if (self.room !== null) {
              if (results[i].roomname === self.room) {
                createHTMLMessage(results[i]);
              }
            } else {
              createHTMLMessage(results[i]);
            }
          }
        }
        self.setScroll();
        typeof cb === 'function' && cb();
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
      var room = this.room;
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

  clearMessages: function(cb){
    $("#chats").html("");
    typeof cb === 'function' && cb();
  },

  addMessage: function(message){
    this.send(message);
  },



  cmd: function(command) {
    command = command.slice(1);
    var parts = command.split(" ");

    if (parts[0] === "list") {
      var rooms = this.getRooms();
      var self = this;

      if (rooms) {
        this.display("<b>" + rooms[0].length + " Available Room" + (rooms.length === 1 ? "" : "s") + "</b>");
        this.display("---------------");

        var a = 0;
        rooms[0].forEach(function(room) {
          self.display("#" + ++a + " " + room + " - " + rooms[1][room] + " message" + (rooms[1][room] === 1 ? "" : "s"));
        });
      }
    } else if (parts[0] === "join") {
      this.join(parts.slice(1).join(" "));
    } else if (parts[0] === "leave") {
      if (this.room !== null) {
        this.leave();
      } else {
        this.display("You are not in a room.")
      }
    } else if (parts[0] === "help") {
      //displayHelp();
    } else {
      this.display("<b>*</b>Unknown command");
    }
    $("#message").val("");
    app.setScroll();
  },

  display: function(message) {
    $("#chats").append("<div class=\"chatCount\"> \
      </div> \
      <div class=\"chat\"> \
      " + message + " \
      <span class=\"timestamp\">" + moment(new Date().getTime()).format("LLL") + "</span> \
    </div>");
  },

  getRooms: function() {
    var self = this;
    var rooms = [];

    Object.keys(this.messages).forEach(function(index) {
      var message = self.messages[index];
      var room = message.roomname;
      if (room !== undefined && room !== null && room !== "") {
        rooms.push(room)
      }
    });
    return [uniq(rooms), count(rooms)];

    function uniq(arr) {
      var seen = {};
      return arr.filter(function(item) {
          return seen.hasOwnProperty(item) ? false : (seen[item] = true);
      });
    }

    function count(arr) {
      var counts = {};

      for(var i = 0; i< arr.length; i++) {
          var num = arr[i];
          counts[num] = counts[num] ? counts[num]+1 : 1;
      }
      return counts;
    }
  },

  join: function(name) {
    this.room = name;
    var self = this;
    //this.clearMessages(function() {
      self.fetch(function() {
        self.display("");
        self.display("You have joined <b>" + self.room + "</b>.");
        self.setScroll();
      });
    //});
  },

  leave: function() {
    this.room = null;
    var self = this;
    //this.clearMessages(function() {
      self.fetch(function() {
        self.display("");
        self.display("You have joined <b>general area</b>.");
        self.setScroll();
      });
    //});
  }

};

$('#send').on("click submit", function(){
  // Detect command
  if ($("#message").val()[0] == "/") {
    app.cmd($("#message").val());
  } else {
    app.send();
    app.setScroll();
  }
  return false;
});

$('#message').keypress(function (e) {
  if (e.which === 13) {
    // Detect command
    if ($("#message").val()[0] == "/") {
      app.cmd($("#message").val());
    } else {
      app.send();
      app.setScroll();
    }
    return false;
  }
});

$(document).ready(function(){
  app.init();
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


var app = {
  server: 'https://api.parse.com/1/classes/chatterbox',
  messages: {},

  init: function() {
    return true;
  },

  fetch: function(){
    var htmlEntities = function(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    var createHTMLMessage = function(obj) {
      var message = htmlEntities(obj.text);
      var user    = obj.username;
      return "<div class=\"chat\"><span class=\"username\">" + user + "</span>: " + message + "</div>";
    }
    var results;
    //fetch messages
    var self = this;
    $.ajax({
      url: this.server,
      type: 'GET',
      success: function (data) {
        results = data.results;
        for(var i = results.length - 1; i >= 0; i --) {
          console.log(self.messages);
          if(!(results[i].objectId in self.messages)) {
            self.messages[results[i].objectId] = results[i];
            var str = createHTMLMessage(results[i]);
            $("#chats").append(results[i].createdAt + " " + str);
          }
        }
      },
      error: function (data) {
        console.error('chatterbox: Failed to get messages');
      }
    });
    return true;
  }
};

app.fetch();
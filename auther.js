//define your auths here
var authNames = ['MTA 48', 'MTA 72'];//the names of each auth type
var scriptIDs = [473, 473];//the script ID of each auth type
var scriptDurations = [48, 72];//the duration of each auth

//This regex selects a sequence of numbers between a '/' and a '-'
//It will select the user's ID from the user's url
//e.g. for the string 'https://osbot.org/forum/profile/655-diclonius/'
//it will select '655'
var regex = /\/([0-9]+)-/;

//run the extension
run();

function run() {
  //first scrape data from the scripter auth page
  $.ajax({
    type: 'GET',
    url: 'https://osbot.org/mvc/scripters/auth',
    error: function() {
      console.log("OSBot Script Auther could not access the auth page")
    },
  }).done(function(data) {
    //parse the data
    var authData = parseAuthData(data);
    addDropdowns(authData);
  });
}

function addDropdowns(authData) {
  //get all comment elements
  var comments = $('article[itemtype="http://schema.org/Comment"]');

  //loop through every comment
  for(var i = 0; i < comments.length; i++) {

    //convert the node to a jQuery object
    var comment = $(comments[i]);

    //get the URL of the user's profile
    var url = comment.find('strong[itemprop="name"]').children().first().attr('href');

    //use the regex from earlier to get the userID
    var userID = regex.exec(url)[1];

    //generate the HTML for the select menu
    var selectHTML = generateSelectHTML(userID, authData);

    //insert the select dropdown in the comment action bar
    comment.find('.ipsComment_controls').children().last().after(selectHTML);
  }

  //add change listeners to the menus
  $('[auth-userID]').change(function() {
    var select = $(this);

    //get the user ID
    var userID = select.attr('auth-userID');

    //get the selected value
    var val = select.find('option:selected').val();

    //if the selected value isn't 'Auth'
    if(val != 'Auth') {

      //index of the auth
      var index = parseInt(val);

      //send the auth request to OSBot
      $.ajax({
        type: 'POST',
        url: 'https://osbot.org/mvc/scripters/auth',
        data: {
          task: 'addauth',
          memberID: userID,
          scriptID: scriptIDs[index],
          authDuration: scriptDurations[index]
        },
        success: function() {
          location.reload();
        },
        error: function() {
          window.alert("Auth Failed :(");
        },
      });
    }
  });
}

function generateSelectHTML(userID, data) {
  var html = '<select style="height:30px; background-color:rgb(100,100,100); border:1px solid rgba(255,255,255,0.1);'
    + 'padding-top: 5px; color: #dddddd; " auth-userID=' + userID + '><option>Auth</option>';

  for(var i = 0; i < authNames.length; i++) {
    if(!data.hasAuth(userID, scriptIDs[i])) {
      html += '<option value="' + i + '">' + authNames[i] + '</option>';
    } else if(data.authExpired(userID, scriptIDs[i])) {
      html += '<option style="background-color:orange" value="' + i + '">' + authNames[i] + '</option>';
    } else {
      html += '<option style="background-color:green" value="' + i + '">' + authNames[i] + '</option>';
    }
  }
  html +='</select>';
  return html;
}

function parseAuthData(raw) {
  var auths = [];

  //get the table of auths from the auth page HTML
  var table = $(raw).eq(13);

  //get the rows of the table
  var rows = table.find('tr');

  //loop through each row
  rows.each(function(index) {

    //if the row isn't the header
    if(index != 0) {
      var row = $(this);

      var children = row.children();
      var scriptID = children.first().text();
      var userID = children.eq(2).text();

      //detect if the auth has expired by the background colour attribute
      var expired = false;
      if(row.attr('bgcolor')) {
        expired = true;
      }

      //add the data from this row to auths
      auths.push([scriptID, userID, expired]);
    }
  });

  //returns true if the user has the script authed even if it is expired
  auths.hasAuth = function(userID, scriptID) {
    for(var i = 0; i < auths.length; i++) {
      if(auths[i][0] == scriptID && auths[i][1] == userID) {
        return true;
      }
    }
    return false;
  }

  //returns true if the user has the script and it has expired
  auths.authExpired = function(userID, scriptID) {
    for(var i = 0; i < auths.length; i++) {
      if(auths[i][0] == scriptID && auths[i][1] == userID && auths[i][2]) {
        return true;
      }
    }
    return false;
  }

  return auths;
}

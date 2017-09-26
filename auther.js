//This regex selects a sequence of numbers between a '/' and a '-'
//It will select the user's ID from the user's url
//e.g. for the string 'https://osbot.org/forum/profile/655-diclonius/'
//it will select '655'
var regex = /\/([0-9]+)-/;

//load the list of auths from storage
chrome.storage.sync.get({
  auths: []
}, function(data) {

  //run the extension
  run(data.auths);
});

function run(auths) {
  //first scrape data from the scripter auth page
  $.ajax({
    type: 'GET',
    url: 'https://osbot.org/mvc/scripters/auth',
    error: function() {
      console.log("OSBot Script Auther could not access the auth page")
    },
  }).done(function(authPageHTML) {
    //parse the data
    var authData = parseAuthData(authPageHTML);
    addDropdowns(authData, auths);
  });
}

function addDropdowns(authData, auths) {

  //profile page
  if(window.location.pathname.indexOf("/forum/profile/") != -1) {
    //get the user ID from the URL
    var userID = regex.exec(window.location.pathname)[1];

    //generate the HTML for the select menu
    var selectElement = generateSelectElement(userID, authData, auths);

    //add drop down to the page
    $('#elProfileStats > ul').append(selectElement);

  } else {//thread page so add drop down to comment
    //get all comment elements
    var comments = $('article.ipsComment');

    //add drop downs to each comment action bar
    comments.each(function() {
      var comment = $(this);

      //get the URL of the user's profile
      var url = comment.find('strong[itemprop="name"]').children().first().attr('href');

      //use the regex from earlier to get the userID
      var userID = regex.exec($(this).find(".cAuthorPane_author a:first").attr('href'))[1];

      //generate the HTML for the select menu
      var selectElement = generateSelectElement(userID, authData, auths);

      //add the drop down to the comment action bar
      comment.find('.ipsComment_controls').append(selectElement);
    });
  }

  //add change listeners to drop downs
  $('[data-userid]').change(function() {
    var select = $(this);

    //get the user ID
    var userID = select.attr('data-userID');

    //get the selected value
    var val = select.find('option:selected').val();

    //if the selected value isn't 'Auth'
    if(val != 'Auth') {

      //index of the auth
      var index = parseInt(val);
      var auth = auths[index];

      //send the auth request to OSBot
      $.ajax({
        type: 'POST',
        url: 'https://osbot.org/mvc/scripters/auth',
        data: {
          task: 'addauth',
          memberID: userID,
          scriptID: auth.scriptID,
          authDuration: auth.duration
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

function generateSelectElement(userID, authData, auths) {
  //create the select element
  var select = $('<select>')
		.attr("data-userid", userID)
		.css({
			"height": "28px",
			"border": "1px solid rgba(255,255,255,0.06)",
			"padding": "0 23px 0 8px",
			"font-weight": "bold",
			"background-color": "rgb(66, 66, 66)",
      "color": "rgb(221, 221, 221)",
      "font-size": "12px",
      "background-image": "url(https://osbot.org/forum/uploads/set_resources_12/84c1e40ea0e759e3f1505eb1788ddf3c_select_dropdown.png"
	});

  //add the title option
  select.append($('<option>').text("Auth"));

  //add an option node for each auth
  for(var i = 0; i < auths.length; i++) {
    var auth = auths[i];
    if(!authData.hasAuth(userID, auth.scriptID)) {
      select.append($('<option>').val(i).text(auth.name));
    } else if(authData.authExpired(userID, auth.scriptID)) {
      select.append($('<option>').val(i).text(auth.name).css({'background-color': 'orange'}));
    } else {
      select.append($('<option>').val(i).text(auth.name).css({'background-color': 'green'}));
    }
  }
  return select;
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

      //add the data from this row to auths
      auths.push({
        scriptID: children.eq(0).text(),
        userID: children.eq(2).text(),
        expired: !!row.attr('bgcolor')//detect if the auth has expired by the background colour attribute
      });
    }
  });

  //returns true if the user has the script authed even if it is expired
  auths.hasAuth = function(userID, scriptID) {
    for(var i = 0; i < auths.length; i++) {
      if(auths[i].scriptID == scriptID && auths[i].userID == userID) {
        return true;
      }
    }
    return false;
  }

  //returns true if the user has the script and it has expired
  auths.authExpired = function(userID, scriptID) {
    for(var i = 0; i < auths.length; i++) {
      if(auths[i].scriptID == scriptID && auths[i].userID == userID && auths[i].expired) {
        return true;
      }
    }
    return false;
  }
  return auths;
}

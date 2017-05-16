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
  //get all the nodes that contain usernames in a forum thread
  var names = $('strong[itemprop=name]');

  //loop through every username
  for(var i = 0; i < names.length; i++) {
    console.log('i=' + i);

    //convert the node to a jQuery object
    var nameNode = $(names[i]);

    //get the URL of the user's profile
    var url = nameNode.children().first().attr('href');

    //use the regex from earlier to get the userID
    var userID = regex.exec(url)[1];

    //generate the HTML for the select menu
    var selectHTML = generateSelectHTML(userID);
    console.log(selectHTML);

    //insert the select dropdown after the username
    nameNode.after(selectHTML);
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
          window.alert("Added Auth!");
        },
        error: function() {
          window.alert("Auth Failed :(");
        },
      });
    }
  });
}

function generateSelectHTML(userID) {
  var html = '<select auth-userID=' + userID + '><option>Auth</option>';
  for(var i = 0; i < authNames.length; i++) {
    html += '<option value="' + i + '">' + authNames[i] + '</option>';
  }
  html +='</select>';
  return html;
}

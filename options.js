//load the list of auths from storage
chrome.storage.sync.get({
  auths: []
}, function(data) {
  console.log("Found auths:");
  console.log(data);

  //once the data is loaded from chrome storage,
  //wait for the document to be ready
  $(document).ready(function() {
    console.log(data);

    //add one row to the table for each auth
    var tableBody = $('#tableBody');
    for(var i = 0; i < data.auths.length; i++) {
      var auth = data.auths[i];
      var rowHTML = generateRowHTML(i, auth);
      console.log("generated html:");
      console.log(rowHTML);
      console.log(tableBody);
      tableBody.prepend(rowHTML);
    }

    //add the delete auth listener
    $('[authID]').click(function() {

      //remove the auth from the array
      var index = parseInt($(this).attr('authID'));
      data.auths.splice(index, 1);

      //update the local storage
      chrome.storage.sync.set({
        auths: data.auths
      }, function() {
        location.reload();
      });
    });

    //add the add auth listener
    $('#addAuth').click(function() {

      //create the new auth object
      var auth = {
        name: $('#authName').val(),
        scriptID: $('#scriptID').val(),
        duration: $('#duration').val()
      };

      //add the new auth to our list of auths
      data.auths.push(auth);

      console.log('auths before saving:');
      console.log(data.auths);

      //update the local storage
      chrome.storage.sync.set({
        auths: data.auths
      }, function() {
        location.reload();
      });
    });
  });
});

function generateRowHTML(authIndex, auth) {
  return '<tr><td>' + auth.name + '</td><td>' + auth.scriptID + '</td><td>' + auth.duration
   + '</td><td><button authID="' + authIndex + '" class="ui inverted red fluid icon button">'
   + '<i class="delete icon"></i></button></td></tr>';
}

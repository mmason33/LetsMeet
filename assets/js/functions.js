// Initialize Firebase
var config = {
  apiKey: "AIzaSyC6B82IlusPIV2rMJA79A9z6uAvSr-SVEE",
  authDomain: "friendlychat-56d31.firebaseapp.com",
  databaseURL: "https://friendlychat-56d31.firebaseio.com",
  projectId: "friendlychat-56d31",
  storageBucket: "friendlychat-56d31.appspot.com",
  messagingSenderId: "379256444845"
};
firebase.initializeApp(config);
var database = firebase.database();
var geocoder = new google.maps.Geocoder();
/*
* @type {string} sitekey A random hashed id for each meet up
**/
var sitekey;
/*
* @type {number} limit The limited amount of users for a given meet up
**/
var limit = 0;
/*********** is this being used *************/
var place = document.getElementById('Place');

var chatroom = {
  initial_name: "",
  initial_message: "",
  current_name: "",
  current_messge: "",
  username: "",
  chatname: "",
  ignore_chat_username: false,
  /*
  * @function UpdateChat
  **/
  UpdateChat: function() {
    database.ref(sitekey + '/chat').on("value", function(snapshot) {
      if (snapshot.child("LatestName").exists() && snapshot.child("LatestMessage").exists()) {
        $("#ChatTitle").text(' ' + snapshot.val().Chatname);
        $('#sitekey').html('SITEKEY (Use to share this meet up): <span>' + sitekey + '</span>');
        chatroom.chatname = snapshot.val().Chatname;
        chatroom.current_message = snapshot.val().LatestMessage;
        chatroom.current_name = snapshot.val().LatestName;
      }
      if (chatroom.current_message != "") {
        $("#ChatBox").append('<h4>' + chatroom.current_name.toUpperCase() + ': ' + chatroom.current_message + '</h4>');
      }
      chatroom.scrollSmoothToBottom("ChatBox");
    }, function(errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
    database.ref(sitekey + '/chatconnections').on("child_added", function(snapshot) {
      $("#UserList").append('<div class="row" id="' + snapshot.val().userName + '"><span class="glyphicon glyphicon-ok"></span> ' + snapshot.val().userName + '</div>');
    }, function(errorObject) {
      console.log("The read failed: " + errorObject.code);
    });
    database.ref(sitekey + '/chatconnections').on("child_removed", function(snapshot) {
      $("#" + snapshot.val().userName).remove();
      $("#" + snapshot.val().userName +'_user').remove();
    });
  },
  /*
  * @function SubmitMessage
  **/
  SubmitMessage: function() {
    event.preventDefault();
      var re = new RegExp('[^<>]+',"g");
      var message = '';
      var pmessage = $("#Message").val().trim();
      var arrayStrings = pmessage.match(re);
      arrayStrings.forEach(function(string){
        message += string;
      })
    chatroom.current_message = message;
    $("#Message").val("");
    $("#Message").focus();

    database.ref(sitekey + '/chat').update({
      LatestName: chatroom.username,
      LatestMessage: chatroom.current_message,
      Chatname: chatroom.chatname
    });
  },
  /*
  * @function scrollSmoothToBottom
  **/
  scrollSmoothToBottom: function(id) {
    var div = document.getElementById(id);
    $('#' + id).animate({
      scrollTop: div.scrollHeight - div.clientHeight
    }, 500);
  }
}
/*
* @function showModal
**/
function showModal(msg) {
	$("#modal-msg").text(msg);
	$("#main-error").modal({
		keyboard: false
	});
}

/**************** WHY IS THIS FUNCTION NEEDED ???? *******************/
function showModal(msg, title) {
	$("#modal-title").text(title);
	$("#modal-msg").text(msg);
	$("#main-error").modal({
		keyboard: false
	});
}
/**************** END WHY IS THIS FUNCTION NEEDED ???? *******************/

/*
* @function keyGen
**/
function keyGen() {
  var length = 10;
  var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
  var key = '';
  for (let i = 0; i < length; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}
/*
* @function createSecondForm
**/
function createSecondForm() {
  $('#StartUp').empty().append(
    '<div class="row second-form">' +
      '<div class="col-md-3"></div>' +
      '<div class="col-md-6 jumbotron">' +
        '<h2>User Info</h2>' +
          '<div class="form-group">' +
            '<label>Name</label>' +
              '<input class="form-control" id="UserName" type="text" placeholder="Please enter a name">' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Location</label>' +
            '<input type="text" name="Location" id="Location" class="form-control" placeholder="Your Location">' +
          '</div>' +
          '<button class="btn btn-success" id="SubmitLocation" type="submit">Submit</button>' +
      '</div>' +
      '<div class="col-md-3"></div>' +
    '</div>'
  );
}
/*
* @function locationFormHandler
**/
function locationFormHandler() {
  var name = "";
  var pname = $('#UserName').val().trim();
  var re = new RegExp('[^<>]+',"g");
  var arrayStrings = pname.match(re);
  arrayStrings.forEach(function(string){
    name += string;
  });

  var location = $('#Location').val().trim();
  chatroom.username = name;
  geocoder.geocode({
    'address': location
  }, function(results, status) {
    if (status == 'OK') {
      let lat = results[0].geometry.location.lat();
      let long = results[0].geometry.location.lng();
      let coordinates = [lat, long];

      var con = database.ref(sitekey + '/connections').push({
        userName: name,
        Location: coordinates
      });

      con.onDisconnect().remove();

      var con2 = database.ref(sitekey + '/chatconnections').push({
        userName: name,
      });

      con2.onDisconnect().remove();

      if (name != '' & location != '') {
        $('#StartUp').remove();
        $('.container').removeClass('hide');
        $('.jumbotron').removeClass('hide');
        chatroom.UpdateChat();
        createMap();
      }

    } else {
      console.log('error: ' + status);
      $('#Location').focus();
      alert('bad address');
    }
  });
}
/*
* @function toRadians
**/
 function toRadians(degree){
  return degree*Math.PI/180;
 }
 /*
 * @function toDegree
 **/
 function toDegree(radian){
  return radian * 180/Math.PI;
 }
 /*
 * @function midpointMultipleLatLon
 **/
function midpointMultipleLatLon(listLatLong){
  if (listLatLong.length == 1) {
    return [listLatLong[0].lat, listLatLong[0].long];
  }

  var x = 0;
  var y = 0;
  var z = 0;

  listLatLong.forEach(function(latLong) {
    var latitude = toRadians(latLong.lat);
    var longitude = toRadians(latLong.long);

    x += Math.cos(latitude) * Math.cos(longitude);
    y += Math.cos(latitude) * Math.sin(longitude);
    z += Math.sin(latitude);
  });

  var total = listLatLong.length;

  x = x / total;
  y = y / total;
  z = z / total;

  var centralLongitude = Math.atan2(y, x);
  var centralSquareRoot = Math.sqrt(x * x + y * y);
  var centralLatitude = Math.atan2(z, centralSquareRoot);

  return [toDegree(centralLatitude), toDegree(centralLongitude)];
}
/*
* @function createMap
**/
function createMap () {
	var users;
	database.ref(sitekey + '/chat').on('value', function(snapshot) {
		users = parseInt(snapshot.val().NumberOfUsers);
	});

  database.ref(sitekey + '/connections').on("value", function(snapshot) {
    var difference = users - snapshot.numChildren();
    if (difference > 1){
      removeMap();
      $("#waiting").text('Waiting for ' +  (users - snapshot.numChildren()) + ' more people')
    }
    else if(difference === 1){
      removeMap();
      $("#waiting").text('Waiting for ' +  (users - snapshot.numChildren()) + ' more person')
    }
    if (snapshot.numChildren() === users) {

		var locations = [];
		database.ref(sitekey + "/connections").once("value").then(function(snapshot){
			snapshot.forEach(function(childSnapshot){
				var location = {lat: childSnapshot.val().Location[0], long: childSnapshot.val().Location[1], name: childSnapshot.val().userName };
				locations.push(location);
			});
			var coordinates = midpointMultipleLatLon(locations);
			var lat = coordinates[0];
			var lon = coordinates[1];
			initMap(lat, lon);
      for (let location in locations) {
        userLocation(locations[location].lat, locations[location].long, locations[location].name);
      }

		 });
    }

  });
}
/*
* @function removeMap
**/
function removeMap(){
  $("#Lobby").remove();
  $("#Map").remove();
  $("#List").remove();
  $("#Place").remove();
  $("#Search").append(
          '<div class="row" id="Lobby">'+
              '<div class="col-xs-6 text-center">' +
                '<div id="UserJoined"></div>'  +
              '</div>' +
              '<div class="col-xs-6">' +
                '<div>' +
                  '<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i><span class="sr-only">Loading...</span>' +
                  '<br>' +
                  '<br>' +
                  '<span id="waiting"></span>' +
                '</div>'  +
              '</div>' +
            '</div>'
    );
    database.ref(sitekey + "/connections").once("value").then(function(snapshot){
      snapshot.forEach(function(childSnapshot){
        $("#UserJoined").append('<div class="bg-success" id="' + childSnapshot.val().userName + '_user"><h3>'+ childSnapshot.val().userName + ' has joined</h3></div>');
      });
    });
}
/*
* @function initMap
**/
function initMap(latitude, longitude) {
  $("#HomeTab").addClass("active");
  $("#ChatTab").removeClass("active");
  $("#Search").addClass("active in");
  $("#Chat").removeClass("active in");
  var pyrmont = {lat: latitude, lng: longitude};
  $('#Lobby').remove();
  $('#Search').append(
  	'<div id="Map"></div>' +
  	'<div id="List"></div>' +
  	'<div id="Place"></div>'
  );
  map = new google.maps.Map(document.getElementById('Map'), {
    center: pyrmont,
    zoom: 13
  });
  infowindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);
  service.nearbySearch({
    location: pyrmont,
    radius: 1500,
    type: ['restaurant']
  }, displayBusinesses);
}
/*
* @function displayBusinesses
**/
function displayBusinesses(results, status) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      createMarker(results[i]);

      let placeId = results[i].place_id;

      let panel = $('<div>', {'class': 'panel panel-default'});
      let panelHeading = $('<div>', {'class': 'panel-heading'});
      let panelTitle = $('<h3>', {'class': 'panel-title'});
      let panelBody = $('<div>', {'class': 'panel-body'});

      panel.append(panelHeading, panelBody);
      panelHeading.append(panelTitle);
      panelTitle.append(results[i].name);
      panelBody.append(results[i].vicinity);
      panelBody.append('<span class="glyphicon glyphicon-menu-down pull-right"></span>');

      panelBody.on('click', function() {
        let height = panelBody.outerHeight();
        getDetails(placeId, panelBody);
        panelBody.off('click');
        panelBody.on('click', function() {
          collapseCard(panelBody, height);
        });
      });

      $('#List').append(panel);
    }
  }
}
/*
* @function createMarker
**/
function createMarker(place) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}
/*
* @function userLocation
**/
function userLocation(latitude, longitude, userName) {
  let title = userName;
  let icon = 'assets/images/man.png';
  let position = { lat: latitude, lng: longitude };
  let marker = new google.maps.Marker({
    position: position,
    map: map,
    title: title,
    icon: icon
  });

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(title);
    infowindow.open(map, this);
  })
}

function getDetails(placeId, el) {
  let placeService = new google.maps.places.PlacesService(place);
  placeService.getDetails({placeId: placeId}, function(place, status) {

    let phoneNumber = place.formatted_phone_number;
    let hours = place.opening_hours.weekday_text;
    let website = place.website;
    let moreInfo = place.url;

    el.append('<br><label class="first">phone number:</label> ' + phoneNumber);
    el.append('<br><label>website:</label> ' + website);
    el.append('<br><label>google page:</label> ' + moreInfo);

    for(let i = 0; i < hours.length; i++) {
      el.append('<span class="list-item">' + hours[i] + '</span>');
    }
  });
}

function collapseCard(el, height) {
  if(el.hasClass('collapsed')) {
    el.attr('style', '').removeClass('collapsed');
  }else{
    el.attr('style', 'max-height:' + height + 'px').addClass('collapsed');
  }
}

$(document).ready(function() {

  $('#myTabs a').click(function(e) {
    e.preventDefault()
    $(this).tab('show')
  });

  $("#SubmitMessage").click(chatroom.SubmitMessage);

  $("#SubmitNewMeetUp").on("click", function(event) {
    event.preventDefault();
    var name = $("#NewMeet").val().trim();
    var numberOfUsers = $('#NumberOfUsers').val();
    limit = parseInt(numberOfUsers);
    sitekey = keyGen();
    if ( name !== '' && numberOfUsers !== '') {
      database.ref(sitekey + '/chat').set({
        NumberOfUsers: numberOfUsers,
        LatestName: "",
        LatestMessage: "",
        Chatname: name
      });
      createSecondForm();
    }

    $('#SubmitLocation').click(function(e) {
      e.preventDefault();
      locationFormHandler();
    });
  });

  $("#SubmitExistingMeetUp").on("click", function(event) {
    event.preventDefault();
    var enteredSiteKey = $('#ExistingMeetUp').val().trim();
    sitekey = $("#ExistingMeetUp").val().trim();
    database.ref(sitekey).once("value").then(function(snapshot){
      if (snapshot.exists() && enteredSiteKey !== '') {
        if(parseInt(snapshot.val().chat.NumberOfUsers) === Object.keys(snapshot.val().connections).length){
          showModal("This meet is currently full.")
        } else{
          createSecondForm();
          $('#SubmitLocation').click(function(e) {
            e.preventDefault();
            locationFormHandler();
          });
        };
      } else {
        showModal("Sitekey doesnt exist");
        $('#ExistingMeetUp').val('').focus();
      };
    });
  });

}); // doc.ready

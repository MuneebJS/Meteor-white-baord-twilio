import { fabric } from 'fabric';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Random } from 'meteor/random';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
// var Timer = require('easytimer.js');
// import Timer from 'easytimer.js'
import Video from 'twilio-video'


import './main.html';

// const Video = require('twilio-video');


// variables
let session;
let classRooms = [];
let sessionId;
let whiteboard_id;
let classroom_access_token;
let studentName = null;
let boardColor = "#000000";
let classDuration;
let archiveId;

// twilio variables
var activeRoom;
var previewTracks;
var identity;
var roomName;

// const baseUrl = 'https://frwrd-whiteboard-server.herokuapp.com/public/api';
const baseUrl = 'https://a1ca4ffa.ngrok.io/whiteboard-app/frwrd-whiteboard/public/api';


// window.addEventListener('beforeunload', leaveRoomIfJoined);





// let boardColor;

// collections
const FabricObjects = new Mongo.Collection('fabricObjects');
Meteor.subscribe('fabricObjects');

Meteor.startup(function () {
  // console.log('startup', sessionStorage.getItem("studentNameSessionStorage"))
  if (sessionStorage.getItem("studentNameSessionStorage")) {
    console.log("local storage item", sessionStorage.getItem("studentNameSessionStorage"))
    getClassRooms(sessionStorage.getItem("studentNameSessionStorage"))
  }
});

// events

Template.header.events({
  "click #home": function () {
    FlowRouter.go("/")
  },
  "click #home-logo": function () {
    FlowRouter.go("/")
  }
})

Template.classes_tabs.events({
  "click .active-classes": function () {
    getClassRooms(sessionStorage.getItem("studentNameSessionStorage"))
    $(".active-classes").addClass("active")
    $(".inactive-classes").removeClass("active")
    // FlowRouter.go('/join_class');
  },
  "click .inactive-classes": function () {
    getInactiveClassRooms();
    $(".active-classes").removeClass("active")
    $(".inactive-classes").addClass("active")
  }
})

// Template.twilio_video.onRendered(function () {
//   initializeSessionForTeacher();
// })

Template.index.events({
  "click .create": function () {
    console.log("create class call");
    let teacherName = $("input[name=teacher_name]").val();
    let className = $("input[name=class_name]").val();
    let duration = $("input[name=class_duration]").val();
    duration = parseInt(duration)

    setTimeout(function () {
      FlowRouter.go(`/teacher/${className}`)
    }, 1000)

    initializeSessionForTeacher(className);

    saveClassDataTwilio(className, teacherName)

    //  TODO: put this code in separate funtion
    var countDown = new Date();
    countDown.setMinutes(countDown.getMinutes() + duration);

    var x = setInterval(function () {

      var now = new Date().getTime();

      // Find the distance between now an the count down date
      var distance = countDown - now;

      // Time calculations for  minutes and seconds
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);
      $("#min").text(minutes);
      $("#sec").text(seconds);

      // If the count down is finished, write some text 
      if (distance < 0) {
        clearInterval(x);
        // exitSessionForTeacher(result.session_id);
      }
    }, 1000);

    // });
  },
  "click .join": function () {
    studentName = $("input[name=student_name]").val();
    console.log("test", studentName);
    sessionStorage.setItem("studentNameSessionStorage", studentName);
    getClassRooms(sessionStorage.getItem("studentNameSessionStorage"));
  },
});



Template.classes.events({
  // "click .class-join": function (event) {
  //   console.log('join click')
  //   // get ids from clicked class
  //   var student_whiteboard_id = this.whiteboard_id;
  //   var class_session_id = this.session_id;
  //   var class_name = this.class_name;
  //   Session.set("sessionId", this.session_id)
  //   $.ajax({
  //     url: baseUrl + '/join-class',
  //     method: 'POST',
  //     data: {
  //       "session_id": this.session_id
  //     },
  //   }).then(function (result) {

  //     Session.set("status", "student");

  //     //  todo: uncomment it
  //     whiteboard_id = student_whiteboard_id;
  //     // whiteboard_id = "classroom_59edc02bab890";
  //     // FlowRouter.go(`/class/${student_whiteboard_id}`)
  //     FlowRouter.go(`/class/${student_whiteboard_id}?class_name=${class_name}`)
  //     let stName = sessionStorage.getItem("studentNameSessionStorage");
  //     whiteboard_id = FlowRouter.getParam("class_id")
  //     $("#class_welcome_msg").text('Welcome ' + stName);
  //     setTimeout(function () {
  //       $("#class_welcome_msg").show();
  //     }, 1000);

  //     //console.log("Join Class: ", result);
  //     //console.log("student_whiteboard_id: ", student_whiteboard_id);
  //     //console.log("class_session_id: ", class_session_id);
  //     initializeSessionForStudent(class_session_id, result.token);
  //   });
  // }
  "click .class-join": function (event) {
    let className = this.class_name;
    // let token = this.teacher_token;
    let student_whiteboard_id = this.whiteboard_id;
    // let identity = this.session_type;
    // console.log("identity from class join event", this)
    whiteboard_id = student_whiteboard_id;
    // Session.set("token", token);
    Session.set("class_name", className)
    // Session.set("session_type", identity)
    // console.log(this)
    FlowRouter.go(`/twilio_student`)
  }
});


Template.boardTools.events({
  'change .isDrawingMode': (event, instance) => {
    instance.isDrawingModeVar.set(event.target.checked);
  },
  'click .clear': () => {
    Meteor.call('clearCanvas');
  },
  'click .erase': () => {
    // console.log("eraser clicked")
    window.canvas.isDrawingMode = true;
    // boardColor = "#ffffff";
    canvas.freeDrawingBrush.color = "#ffffff";
    // console.log("board color erase", boardColor)

  },
  'change .lineWidth': (event, instance) => {
    console.log(event.target.value)
  },
  'click .draw': (event, instance) => {
    window.canvas.isDrawingMode = true;
    canvas.freeDrawingBrush.color = boardColor;

  },
  'click #add-circle': (event, instance) => {
    addCircle();
    window.canvas.isDrawingMode = false;
  },
  'click #add-square': (event, instance) => {
    addSquare();
    window.canvas.isDrawingMode = false;
  },
  'click #add-rect': (event, instance) => {
    addRect();
    window.canvas.isDrawingMode = false;
  },
  'click #add-text': (event, instance) => {
    addCustomText();
    window.canvas.isDrawingMode = false;
  },
  'click .downloadImage': () => {
    canvas.setBackgroundColor('#fff', canvas.renderAll.bind(canvas))
  },
  "click .black-clr": function () {
    boardColor = "#000000";
    canvas.freeDrawingBrush.color = boardColor;
  },
  "click .blue-clr": function () {
    boardColor = "#0033AA";
    canvas.freeDrawingBrush.color = boardColor;
  },
  "click .red-clr": function () {
    boardColor = "#CC0000";
    canvas.freeDrawingBrush.color = boardColor;
  },
});

Template.teacher.events({
  'click .exit-class': (event) => {
    let classSessionId = $("input[name=class_session_id]").val();
    console.log("exit class call", whiteboard_id);
    $.ajax({
      url: baseUrl + '/exit-class-room',
      method: 'POST',
      data: {
        "whiteboard_id": whiteboard_id
      },
    }).then(function (result) {
      console.log("exit Class Response: ", result);
      exitSessionForTeacher(classSessionId);
      // FlowRouter.go('/');
    });
  },

})


// helpers
Template.board.helpers({
  isDrawingMode() {
    return Template.instance().isDrawingModeVar.get();
  },
  objectsCount() {
    return FabricObjects.find().count();
  },
});


// onCreated
window.canvas = null;

// boardTools was board
Template.board.onCreated(function () {
  this.isDrawingModeVar = new ReactiveVar(true);

});

Template.mobile.onCreated(function () {
  whiteboard_id = FlowRouter.getParam("class_id")
})



// Template.twilio_test.onRendered(function () {
//   function attachTracks(tracks, container) {
//     tracks.forEach(function(track) {
//       container.appendChild(track.attach());
//     });
//   }

//   // Attach the Participant's Tracks to the DOM.
//   function attachParticipantTracks(participant, container) {
//     var tracks = Array.from(participant.tracks.values());
//     attachTracks(tracks, container);
//   }

//   // Detach the Tracks from the DOM.
//   function detachTracks(tracks) {
//     tracks.forEach(function(track) {
//       track.detach().forEach(function(detachedElement) {
//         detachedElement.remove();
//       });
//     });
//   }

//   // Detach the Participant's Tracks from the DOM.
//   function detachParticipantTracks(participant) {
//     var tracks = Array.from(participant.tracks.values());
//     detachTracks(tracks);
//   }

//   // When we are about to transition away from this page, disconnect
//   // from the room, if joined.
//   window.addEventListener('beforeunload', leaveRoomIfJoined);

//   // Obtain a token from the server in order to connect to the Room.
//   $.getJSON('http://localhost:3050/token', function(data) {
//   // $.getJSON('http://230edfa6.ngrok.io/token', function(data) {
//     identity = data.identity;
//     document.getElementById('room-controls').style.display = 'block';

//     // Bind button to join Room.
//     document.getElementById('button-join').onclick = function() {
//       roomName = document.getElementById('room-name').value;
//       if (!roomName) {
//         alert('Please enter a room name.');
//         return;
//       }

//       log("Joining room '" + roomName + "'...");
//       var connectOptions = {
//         name: roomName,
//         logLevel: 'debug'
//       };

//       if (previewTracks) {
//         connectOptions.tracks = previewTracks;
//       }

//       // Join the Room with the token from the server and the
//       // LocalParticipant's Tracks.
//       Video.connect(data.token, connectOptions).then(roomJoined, function(error) {
//         log('Could not connect to Twilio: ' + error.message);
//       });
//     };

//     // Bind button to leave Room.
//     document.getElementById('button-leave').onclick = function() {
//       log('Leaving room...');
//       activeRoom.disconnect();
//     };
//   });

//   // Successfully connected!
//   function roomJoined(room) {
//     window.room = activeRoom = room;

//     log("Joined as '" + identity + "'");
//     document.getElementById('button-join').style.display = 'none';
//     document.getElementById('button-leave').style.display = 'inline';

//     // Attach LocalParticipant's Tracks, if not already attached.
//     var previewContainer = document.getElementById('local-media');
//     if (!previewContainer.querySelector('video')) {
//       attachParticipantTracks(room.localParticipant, previewContainer);
//     }

//     // Attach the Tracks of the Room's Participants.
//     room.participants.forEach(function(participant) {
//       log("Already in Room: '" + participant.identity + "'");
//       var previewContainer = document.getElementById('remote-media');
//       attachParticipantTracks(participant, previewContainer);
//     });

//     // When a Participant joins the Room, log the event.
//     room.on('participantConnected', function(participant) {
//       log("Joining: '" + participant.identity + "'");
//     });

//     // When a Participant adds a Track, attach it to the DOM.
//     room.on('trackAdded', function(track, participant) {
//       log(participant.identity + " added track: " + track.kind);
//       var previewContainer = document.getElementById('remote-media');
//       attachTracks([track], previewContainer);
//     });

//     // When a Participant removes a Track, detach it from the DOM.
//     room.on('trackRemoved', function(track, participant) {
//       log(participant.identity + " removed track: " + track.kind);
//       detachTracks([track]);
//     });

//     // When a Participant leaves the Room, detach its Tracks.
//     room.on('participantDisconnected', function(participant) {
//       log("Participant '" + participant.identity + "' left the room");
//       detachParticipantTracks(participant);
//     });

//     // Once the LocalParticipant leaves the room, detach the Tracks
//     // of all Participants, including that of the LocalParticipant.
//     room.on('disconnected', function() {
//       log('Left');
//       if (previewTracks) {
//         previewTracks.forEach(function(track) {
//           track.stop();
//         });
//       }
//       detachParticipantTracks(room.localParticipant);
//       room.participants.forEach(detachParticipantTracks);
//       activeRoom = null;
//       document.getElementById('button-join').style.display = 'inline';
//       document.getElementById('button-leave').style.display = 'none';
//     });
//   }

//   // Preview LocalParticipant's Tracks.
//   // document.getElementById('button-preview').onclick = function() {
//   //   var localTracksPromise = previewTracks
//   //     ? Promise.resolve(previewTracks)
//   //     : Video.createLocalTracks();

//   //   localTracksPromise.then(function(tracks) {
//   //     window.previewTracks = previewTracks = tracks;
//   //     var previewContainer = document.getElementById('local-media');
//   //     if (!previewContainer.querySelector('video')) {
//   //       attachTracks(tracks, previewContainer);
//   //     }
//   //   }, function(error) {
//   //     console.error('Unable to access local media', error);
//   //     log('Unable to access Camera and Microphone');
//   //   });
//   // };

//   // Activity log.
//   // function log(message) {
//   //   var logDiv = document.getElementById('log');
//   //   logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
//   //   logDiv.scrollTop = logDiv.scrollHeight;
//   // }

//   // Leave Room.
//   function leaveRoomIfJoined() {
//     if (activeRoom) {
//       activeRoom.disconnect();
//     }
//   }
// })

Template.twilio_student.onRendered(function () {
  console.log("twilio_student run")
  // let className = FlowRouter.getQueryParam("class_name");
  // let token = FlowRouter.getQueryParam("token")
  let className = Session.get("class_name");
  // let token = Session.get("token");
  // let identity = Session.get("session_type")
  // console.log("identity from onrendered", identity)
  // console.log("twilio_student  ", className, token)
  // initializeSessionForStudent(className)
  initializeSessionForTeacher(className)
})

Template.home.onRendered(function () {

})

Template.teacher.onRendered(function () {
  // openNewTab();
  let height = $(document).height();
  let width = $('#canvas').parent().width();
  Session.set("height", height);
  Session.set("width", width);
  $("#class_title").text(FlowRouter.getParam("class_name"))
  $(".exit-class").show();
  $("#countDown").show();
  $("#downloadImage").show();
  $("#class_title_wrap").show();
  $("#start_archive").show()
  sessionId = Session.get("sessionId");
  archiveId = Session.get("archiveId");


  $("#stop_archive").click(function () {
    // console.log("stop archive archive id", this.archive_id)
    stopArchive(archiveId);
    $("#start_archive").show()
    $("#stop_archive").hide()
  })

  $("#start_archive").click(function () {
    startArchive(sessionId)
    $("#stop_archive").show()
    $("#start_archive").hide()
  })

})

Template.mobile.onRendered(function () {
  window.canvas.isDrawingMode = false;
})

Template.student.onRendered(function () {
  window.canvas.isDrawingMode = false;
  // archiveId = Session.get("archiveId");

  $("#class_title").text(FlowRouter.getQueryParam("class_name"))
  $("#downloadImage").show();
  $("#class_title_wrap").show();

})


Template.board.onRendered(function () {
  const canvas = new fabric.Canvas('canvas', {
    selection: false,
  });
  let height = $(document).height();
  let width = $('#canvas').parent().width();

  canvas.setDimensions({ width: width, height: 450 });

  this.canvas = canvas;
  window.canvas = canvas;
  saveImage(canvas);

  this.autorun(() => {
    canvas.isDrawingMode = this.isDrawingModeVar.get();
    canvas.freeDrawingBrush.color = boardColor;
    canvas.freeDrawingBrush.width = 5;
  });


  canvas.on('object:added', (e) => {
    const fabricObject = e.target;
    if (fabricObject.id) {
      return; // this already is on server
    }

    // assign a custom id to a newly crated object
    fabricObject.id = Random.id();
    const doc = fabricObject.toObject();
    doc._id = fabricObject.id; // eslint-disable-line no-underscore-dangle
    doc.whiteboard_id = whiteboard_id;
    FabricObjects.insert(doc);
  });

  canvas.on('object:modified', (e) => {
    const fabricObject = e.target;

    if (!fabricObject.id) {
      console.error(`Missing id at object ${fabricObject}`);
      return;
    }

    FabricObjects.update(fabricObject.id, {
      $set: fabricObject.toObject(),
    });
  });

  this.observer = FabricObjects.find().observeChanges({
    added: (id, doc) => {
      const objectOnCanvas = canvas.getObjectById(id);
      if (objectOnCanvas) {
        return; // nothing to do
      }
      fabric.util.enlivenObjects([doc], ([fabricObject]) => {
        // console.log("whiteboard_id: ", whiteboard_id);
        // console.log("whiteboard_id: ", doc.whiteboard_id);

        if (doc.whiteboard_id !== undefined && doc.whiteboard_id == whiteboard_id) {
          fabricObject.id = id;
          canvas.add(fabricObject);
        }
      });
    },
    changed: (id, fields) => {
      const objectOnCanvas = canvas.getObjectById(id);
      if (!objectOnCanvas) {
        return; // nothing to do
      }

      objectOnCanvas.set(fields);
      canvas.renderAll();
    },
    removed: (id) => {
      const objectOnCanvas = canvas.getObjectById(id);
      if (!objectOnCanvas) {
        return; // nothing to do
      }

      canvas.remove(objectOnCanvas);
    },
  });
});


// functions
function leaveRoomIfJoined() {
  if (activeRoom) {
    activeRoom.disconnect();
  }
}

function attachTracks(tracks, container) {
  tracks.forEach(function (track) {
    container.appendChild(track.attach());
  });
}

// Attach the Participant's Tracks to the DOM.
function attachParticipantTracks(participant, container) {
  var tracks = Array.from(participant.tracks.values());
  attachTracks(tracks, container);
}

// Detach the Tracks from the DOM.
function detachTracks(tracks) {
  tracks.forEach(function (track) {
    track.detach().forEach(function (detachedElement) {
      detachedElement.remove();
    });
  });
}

// Detach the Participant's Tracks from the DOM.
function detachParticipantTracks(participant) {
  var tracks = Array.from(participant.tracks.values());
  detachTracks(tracks);
}

function saveClassDataTwilio(className, teacherName, token) {
  $.ajax({
    url: baseUrl + '/create-class-room-twilio',
    type: "POST",
    contentType: "application/json", // send as JSON
    data: JSON.stringify({
      "class_name": className,
      "teacher_name": teacherName,  
    }),
    success: function (response) {
      //called when successful
      console.log('successfully called save create class twilio request)', response);
      // Session.set("whiteboard_id", response.whiteboard_id);
      whiteboard_id = response.whiteboard_id;
    },
    error: function (error) {
      //called when there is an error
      console.log('error calling  create class twilio', error);
    },
  });
}

function getArchiveIdForStudent() {
  sessionId = Session.get("sessionId");
  $.get(`${baseUrl}/get-student-archive/${sessionId}`)
    .done(function (data) {
      // console.log("get archive id from student done", data)
      Session.set("archiveId", data.archive_id);

      if (data.archive_id) {
        $("#archive_available_txt").show();
        getArchiveUrl()
      }
      else {
        console.log("getArchiveIdForStudent() else run")
      }
    })
    .fail(function (error) {
      console.log("get archive error", error)
    })
}

function doAfterArchiveUrl(url, archive_id) {
  // let url = data.url;
  let mp4Index = url.indexOf('.mp4');
  let archiveUrl = url.slice(0, mp4Index + 4);
  // let archiveUrl = data.url;
  Session.set("archiveUrl", archiveUrl)
  makeDownlAnchor(archiveUrl)
  saveArchiveUrl(archiveUrl, archive_id)
}


function saveArchiveUrl(url, archive_id) {
  // set archive url in db  
  $.ajax({
    url: baseUrl + '/save-archive-url',
    type: "POST",
    contentType: "application/json", // send as JSON
    data: JSON.stringify({
      "archive_url": url,
      "archive_id": archive_id
    }),
    success: function (response) {
      //called when successful
      console.log('successfully called save archive id request)', response);
    },
    error: function (error) {
      //called when there is an error
      console.log('error calling stopArchive()', error);
    },
  })
}



function getArchiveUrl() {
  let archive_id = Session.get("archiveId")
  $.get(`${baseUrl}/get-archive/${archive_id}`)
    .done(function (data) {
      console.log("getArchiveUrl data", data)
      if (data.status == "available") {
        $("#archive_available_txt").hide();
        $("#archive_added_msg").show();
        console.log("getArchiveUrl if run")
        doAfterArchiveUrl(data.url, archive_id)

      }
      else {
        console.log("getArchiveUrl else run")
        $("#archive_available_txt").show();
        // $("#get_archive_again").show();
        setTimeout(getArchiveUrl(), 5000);
      }

    })
    .fail(function (error) {
      console.log("get archive error", error)
    })
}

function makeDownlAnchor(url) {
  $("#downl_archive_wrap").show();
  $("#view_archive_wrap").show();
  $("#archive_available_txt").hide();
  $(".downl-archive").prop("href", url);
  $(".view-archive").prop("href", url);
}


function stopArchive(archive_id) {
  console.log("stopArchive() archive id", archive_id)
  $.ajax({
    url: baseUrl + '/archive-stop',
    type: "POST",
    contentType: "application/json", // send as JSON
    data: JSON.stringify({ "archive_id": archive_id }),
    complete: function (response) {
      console.log('stopArchive() complete', response);
    },
    success: function (response) {
      //called when successful
      console.log('successfully called stopArchive()', response);
    },
    error: function (error) {
      //called when there is an error
      console.log('error calling stopArchive()', error);
    },
  })
}

function startArchive(sessionId) {
  console.log("Start Archive sessionId", sessionId);
  $.ajax({
    url: baseUrl + '/archive-start',
    type: "POST",
    contentType: "application/json", // send as JSON
    data: JSON.stringify({ "session_id": sessionId }),

    success: function (response) {
      //called when successful
      console.log('successfully called startArchive()', response);
      archiveId = response.archive_id;
      Session.set("archiveId", response.archive_id);

      $.ajax({
        url: baseUrl + '/save-archive',
        type: "POST",
        contentType: "application/json", // send as JSON
        data: JSON.stringify({
          "session_id": sessionId,
          "archive_id": response.archive_id
        }),

        success: function (response) {
          //called when successful
          console.log('successfully called save arhive id()', response);
        },

        error: function (error) {
          //called when there is an error
          console.log('error calling save arhive id()', error);
        },
      })
    },

    error: function (error) {
      //called when there is an error
      console.log('error calling startArchive()', error);
    },
  })
}

function getClassRooms(stName) {
  $.get(`${baseUrl}/get-class-rooms`, function (data, a) {
    classRooms = data.reverse();
    Template.classes.helpers({
      classes: classRooms
    });
    FlowRouter.go('/join_class')
    $("#class_welcome_msg").text('Welcome ' + stName);
    setTimeout(function () {
      $("#class_welcome_msg").show();
    }, 1000);
  });
}

function getInactiveClassRooms() {
  $.get(`${baseUrl}/get-inactive-class-rooms`, function (data, a) {
    classRooms = data.reverse();
    Template.inactive_classes.helpers({
      classes: classRooms
    });
    FlowRouter.go('/inactive_classes')
  });
}

function addCircle() {
  console.log("boarColor", boardColor)
  let circle = new fabric.Circle({
    left: 50,
    top: 50,
    radius: 25,
    startAngle: 0,
    endAngle: 2 * Math.PI,
    stroke: boardColor,
    strokeWidth: 2,
    fill: 'transparent'
  });

  canvas.add(circle);

}

function addSquare() {
  let square = new fabric.Rect({
    width: 100,
    height: 100,
    fill: 'transparent',
    opacity: 1,
    left: 0,
    top: 0,
    stroke: boardColor,
    strokeWidth: 2,
  });
  canvas.add(square);
}

function addRect() {
  var rect = new fabric.Rect({
    top: 100,
    left: 0,
    width: 80,
    height: 50,
    fill: 'transparent',
    stroke: boardColor,
    strokeWidth: 2,
  });
  canvas.add(rect);
}

function addCustomText() {
  let text = new fabric.IText('type here', {
    fontFamily: 'arial black',
    left: 100,
    top: 100,
    fill: boardColor,
  });
  canvas.add(text);
}

function doAfterExit() {
  $("#get_archive").show()
  $("#start_archive").hide()
  $("#stop_archive").hide()
  $("#exit_class").hide()
  // $("#archive_available_txt").show();
}

function exitSessionForTeacher(classSessionId) {
  var apiKey = '45992982';
  var session = OT.initSession(apiKey, classSessionId);
  session.disconnect();
  $("#countDown").hide();
  doAfterExit();
  let archiveId = Session.get("archiveId")
  if (archiveId) {
    $("#archive_available_txt").show();
    getArchiveUrl();
  }

}

function exitSessionForStudent(classSessionId) {
  var apiKey = '45992982';
  var session = OT.initSession(apiKey, classSessionId);
  session.disconnect();
  doAfterExit();
  // let archiveId = Session.get("archiveId")
  getArchiveIdForStudent();
}


fabric.Canvas.prototype.getObjectById = function (id) {
  return this.getObjects().find(obj => obj.id === id);
};


function saveImage(canvas) {
  canvas.setBackgroundColor('#fff', canvas.renderAll.bind(canvas))
  var link = document.createElement('a');
  link.innerHTML = '<span class="glyphicon glyphicon-save"></span> Save';
  // link.classList.add()
  link.addEventListener('click', function (ev) {
    link.href = canvas.toDataURL('png');
    link.download = "white board";
  }, false);
  document.getElementById("downloadImage").appendChild(link);
  // document.body.appendChild(link);
}

// Tokbox 

// ntcomment

function initializeSessionForStudent(className) {
  console.log("initializeSessionForStudent run", className)

  $.getJSON(`http://localhost:3050/?identity=alice&room=${className}`, function (data) {
    // console.log("initializeSessionForStudent data ", data)
    Video
      .connect(data.token, {
        name: className,
      })
      .then(
      function (room) {
        const localParticipant = room.localParticipant;
        console.log("initializeSessionForStudent room", room)
        localParticipant.tracks.forEach(track => {
          document.getElementById('remote-media').appendChild(track.attach());
        });
        // room.on('participantConnected', participantConnected);
        room.on('participantConnected', participant => {
          console.log("participantConnected", participant)
          participant.tracks.forEach(track => {
            console.log("participantConnected each track", track)
            document.getElementById('remote-media').appendChild(track.attach());
          });
        });
      },
      function (error) {
        console.error('Failed to connect to the Room', error);
      });
  });

}

// chcomment
function initializeSessionForTeacher(className) {
  // let roomName = className;
  $.getJSON(`http://localhost:3050/?room=${className}`, function (data) {
    // $.getJSON(`https://7909c1a5.ngrok.io/`, function(data) {
    identity = data.identity;
    roomName = data.room
    // document.getElementById('room-controls').style.display = 'block';

    // Bind button to join Room.
    // document.getElementById('button-join').onclick = function() {
    // roomName = document.getElementById('room-name').value;
    if (!roomName) {
      alert('Please enter a room name.');
      return;
    }

    // log("Joining room '" + roomName + "'...");
    var connectOptions = {
      name: roomName,
      // logLevel: 'debug',
      video: {
        width: 200,
        height: 200
      }
    };

    if (previewTracks) {
      connectOptions.tracks = previewTracks;
    }

    // Join the Room with the token from the server and the
    // LocalParticipant's Tracks.
    Video.connect(data.token, connectOptions).then(roomJoined, function (error) {
      // log('Could not connect to Twilio: ' + error.message);
    });
    // };

    // Bind button to leave Room.
    // document.getElementById('button-leave').onclick = function() {
    //   // log('Leaving room...');
    //   activeRoom.disconnect();
    // };
  });

  function roomJoined(room) {
    window.room = activeRoom = room;

    // log("Joined as '" + identity + "'");
    // document.getElementById('button-join').style.display = 'none';
    // document.getElementById('button-leave').style.display = 'inline';

    // Attach LocalParticipant's Tracks, if not already attached.
    var previewContainer = document.getElementById('local-media');
    if (!previewContainer.querySelector('video')) {
      attachParticipantTracks(room.localParticipant, previewContainer);
    }

    // Attach the Tracks of the Room's Participants.
    room.participants.forEach(function (participant) {
      // log("Already in Room: '" + participant.identity + "'");
      var previewContainer = document.getElementById('remote-media');
      attachParticipantTracks(participant, previewContainer);
    });

    // When a Participant joins the Room, log the event.
    room.on('participantConnected', function (participant) {
      // log("Joining: '" + participant.identity + "'");
    });

    // When a Participant adds a Track, attach it to the DOM.
    room.on('trackAdded', function (track, participant) {
      // log(participant.identity + " added track: " + track.kind);
      var previewContainer = document.getElementById('remote-media');
      attachTracks([track], previewContainer);
    });

    // When a Participant removes a Track, detach it from the DOM.
    room.on('trackRemoved', function (track, participant) {
      // log(participant.identity + " removed track: " + track.kind);
      detachTracks([track]);
    });

    // When a Participant leaves the Room, detach its Tracks.
    room.on('participantDisconnected', function (participant) {
      // log("Participant '" + participant.identity + "' left the room");
      detachParticipantTracks(participant);
    });

    // Once the LocalParticipant leaves the room, detach the Tracks
    // of all Participants, including that of the LocalParticipant.
    room.on('disconnected', function () {
      // log('Left');
      if (previewTracks) {
        previewTracks.forEach(function (track) {
          track.stop();
        });
      }
      detachParticipantTracks(room.localParticipant);
      room.participants.forEach(detachParticipantTracks);
      activeRoom = null;
      // document.getElementById('button-join').style.display = 'inline';
      // document.getElementById('button-leave').style.display = 'none';
    });
  }
}




















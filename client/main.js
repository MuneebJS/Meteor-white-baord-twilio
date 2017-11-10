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
let activeRoom;
let previewTracks;
let identity;
let roomName;

// const baseUrl = 'https://frwrd-whiteboard-server.herokuapp.com/public/api';
const baseUrl = 'http://19c9e567.ngrok.io/whiteboard-app/frwrd-whiteboard/public/api';
// const baseUrlNode = 'https://4fb4f968.ngrok.io/';
const baseUrlNode = 'http://localhost:3050';
// const baseUrlNode = '  https://ebe20e90.ngrok.io';


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
    Session.set("class_name", className);
    duration = parseInt(duration)

    setTimeout(function () {
      FlowRouter.go(`/teacher/${className}`)
    }, 1000)


    let name = 'Teacher';
    initializeSessionForTeacher(className, name);

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
    // FlowRouter.go(`/twilio_student`)
    FlowRouter.go(`/student`)
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
    // let classSessionId = $("input[name=class_session_id]").val();
    // console.log("exit class call", whiteboard_id);
    let className = Session.get("class_name");
    if (className) {
      exitClassRoom(className);
    }
    else {
      console.log("className type", typeof className)
    }


  }

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
  // $("#start_archive").show()
  sessionId = Session.get("sessionId");
  archiveId = Session.get("archiveId");


  // $("#stop_archive").click(function () {
  //   // console.log("stop archive archive id", this.archive_id)
  //   stopArchive(archiveId);
  //   $("#start_archive").show()
  //   $("#stop_archive").hide()
  // })

  // $("#start_archive").click(function () {
  //   startArchive(sessionId)
  //   $("#stop_archive").show()
  //   $("#start_archive").hide()
  // })

})

Template.mobile.onRendered(function () {
  window.canvas.isDrawingMode = false;
})

Template.student.onRendered(function () {
  window.canvas.isDrawingMode = false;

  let studentName = sessionStorage.getItem("studentNameSessionStorage");
  let refId = Math.floor(Math.random() * 90000) + 10000;
  let name = studentName + '-' + refId;

  let className = Session.get("class_name");

  initializeSessionForTeacher(className, name)
  $("#downloadImage").show();
  $("#class_title_wrap").show();
  $("#class_title").text(className);


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

// function initializeSessionForStudent(className) {
//   console.log("initializeSessionForStudent run", className)

//   $.getJSON(`http://localhost:3050/?identity=alice&room=${className}`, function (data) {
//     // console.log("initializeSessionForStudent data ", data)
//     Video
//       .connect(data.token, {
//         name: className,
//       })
//       .then(
//       function (room) {
//         const localParticipant = room.localParticipant;
//         console.log("initializeSessionForStudent room", room)
//         localParticipant.tracks.forEach(track => {
//           document.getElementById('remote-media').appendChild(track.attach());
//         });
//         // room.on('participantConnected', participantConnected);
//         room.on('participantConnected', participant => {
//           console.log("participantConnected", participant)
//           participant.tracks.forEach(track => {
//             console.log("participantConnected each track", track)
//             document.getElementById('remote-media').appendChild(track.attach());
//           });
//         });
//       },
//       function (error) {
//         console.error('Failed to connect to the Room', error);
//       });
//   });

// }


// chcomment
function exitClassRoom(className) {

  $.get(`${baseUrlNode}/room-complete?room=${className}`,
    function (data) {
      alert(data)
    });
  console.log("exitClasRoom fire", className)
}

function initializeSessionForTeacher(className, identityName) {
  // let roomName = className;
  $.getJSON(`${baseUrlNode}/?room=${className}&identity=${identityName}`, function (data) {
    // $.getJSON(`${baseUrlNode}/?room=${className}`, function (data) {
    // $.getJSON(`https://7909c1a5.ngrok.io/`, function(data) {

    identity = data.identity;
    roomName = data.room

    if (!roomName) {
      alert('Please enter a room name.');
      return;
    }

    // log("Joining room '" + roomName + "'...");
    // var connectOptions = {
    //   name: roomName,
    //   // logLevel: 'debug',
    //   video: {
    //     width: 200,
    //     height: 200
    //   }
    // };
    if (studentName == "Teacher") {
      var connectOptions = {
        name: roomName,
        // logLevel: 'debug',
        participantName: identity,
        video: {
          width: 200,
          height: 200
        }
      };
    } else {
      var connectOptions = {
        name: roomName,
        // logLevel: 'debug',
        participantName: identity,
        video: {
          width: 100,
          height: 100
        }
      };
    }

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

    console.log("hello room", room);
    if (room._options.participantName != "Teacher") {
      let identityName = room._options.participantName.split('-');
      $("#students-list").append("<li class='' id='" + identityName[0] + "'><a href='#'>" + identityName[0] + "</a></li>");
    }


    // Attach LocalParticipant's Tracks, if not already attached.
    var previewContainer = document.getElementById('local-media');
    if (!previewContainer.querySelector('video')) {
      attachParticipantTracks(room.localParticipant, previewContainer);
    }

    // Attach the Tracks of the Room's Participants.
    room.participants.forEach(function (participant) {
      console.log("Already in Room participant.identity: '" + participant.identity + "'");
      if (participant.identity != "Teacher") {
        let identityName = participant.identity.split('-');
        $("#students-list").append("<li class='' id='" + identityName[0] + "'><a href='#'>" + identityName[0] + "</a></li>");
      }

      var previewContainer = document.getElementById('remote-media');
      attachParticipantTracks(participant, previewContainer);
    });

    // When a Participant joins the Room, log the event.
    room.on('participantConnected', function (participant) {

      if (participant.identity != "Teacher") {
        let identityName = participant.identity.split('-');
        $("#students-list").append("<li class='' id='" + identityName[0] + "'><a href='#'>" + identityName[0] + "</a></li>");
      }
      console.log("Joining a new participant: '" + participant + "'");
      console.log("Joining a new participant identity: '" + participant.identity + "'");

    });

    // When a Participant adds a Track, attach it to the DOM.
    room.on('trackAdded', function (track, participant) {

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
      if (participant.identity != "Teacher") {
        let identityName = participant.identity.split('-');
        $("#students-list").find('li:contains("' + identityName + '")').remove();
      }

      console.log("Participant '" + participant.identity + "' left the room");
      detachParticipantTracks(participant);

    });

    // Once the LocalParticipant leaves the room, detach the Tracks
    // of all Participants, including that of the LocalParticipant.
    room.on('disconnected', function () {
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
  // setTimeout(function () {
  //   exitClassRoom(Session.get("class_name"))  
  // }, 15000)
}




















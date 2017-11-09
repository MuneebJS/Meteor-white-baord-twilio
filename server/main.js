/* eslint-disable import/prefer-default-export */

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';


// var http = require('http');
// var path = require('path');
var AccessToken = require('twilio').jwt.AccessToken;
var VideoGrant = AccessToken.VideoGrant;
var express = require('express');

var app = express();

/* export */ const FabricObjects = new Mongo.Collection('fabricObjects');

Meteor.publish('fabricObjects', function fabricObjects() {
  // if (!this.userId()) {
    // this.ready();
    // return [];
  // }

  return FabricObjects.find();
});

Meteor.methods({
  clearCanvas() {
    // if (! Meteor.userId()) {
    //   throw new Meteor.Error("not-authorized");
    // }

    FabricObjects.remove({});
  },
});

// Meteor.startup(() => {
//   Meteor.startup(function () {
//     // code to run on server at startup
//     Meteor.methods({
//       getToken: function (name) {
//         var AccessToken = Meteor.npmRequire('twilio').AccessToken;
//         // var VideoGrant = AccessToken.VideoGrant;
//         var VideoGrant = AccessToken.VideoGrant;
//         var appName = 'TwilioChatDemo';
//         var identity = 'Alice';
//         var deviceId = 'Browser';
   
//         // Create a unique ID for the client on their current device
//         var endpointId = appName + ':' + identity + ':' + deviceId;
   
//         // Create a "grant" which enables a client to use IPM as a given user,
//         // on a given device
//         var ipmGrant = new VideoGrant({
//             // serviceSid: '{{ SERVICE_SID }}',
//             // endpointId: endpointId

          
//         });
   
//         // Create an access token which we will sign and return to the client,
//         // containing the grant we just created
//         var token = new AccessToken(
//             '{{ TWILIO_ACCOUNT_SID }}',
//             '{{ TWILIO_API_KEY }}',
//             '{{ TWILIO_API_SECRET }}'
//         );
//         token.addGrant(ipmGrant);
//         token.identity = identity;
   
//         // Serialize the token to a JWT string and include it in a JSON response
//         return token.toJwt();
//       }
//     });
//   });
// });
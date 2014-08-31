/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var bcrypt = require('bcrypt');

function isEncrypted(string) {
  try {
    bcrypt.getRounds(string);
    return true;
  } catch (e) {
    return false;
  }
}

var UserModel = {

  attributes: {
    email: {
      type: 'string',
      required: true,
      index: true
    },

    password: {
      type: 'string',
      required: true
    },

    role: {
      type: 'string',
      enum: ['user', 'admin'],
      defaultsTo: 'user'
    },

    feeds: {
      collection: 'feed',
      via: 'users',
      dominant: true
    }
  },

  beforeCreate: function(userData, callback) {
    if(!isEncrypted(userData.password)) {
      bcrypt.hash(userData.password, 10, function(err, encryptedPassword) {
        userData.password = encryptedPassword;
        callback();
      });
    } else {
      callback();
    }
  }
};

module.exports = UserModel;
/**
 * Feed.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

FeedMatcher = function(regex, feedIdIndex, website, feedType) {
  this.regex = regex;
  this.feedIdIndex = feedIdIndex;
  this.website = website;
  this.feedType = feedType;
  this._match = null;

  this.isMatch = function(url) {
    this._match = this.regex.exec(url);
    return this._match != null;
  };

  this.getFeedId = function() {
    return this._match[this.feedIdIndex];
  };
};

var feedMatchers = [];

function addFeedMatcher(regex, feedIdIndex, website, feedType) {
  feedMatchers.push(new FeedMatcher(regex, feedIdIndex, website, feedType));
}

addFeedMatcher(/youtube.com\/user\/(\w*)[\?\&]?/i, 1, 'youtube', 'channel');

function findOrCreateFeed(criteria, callback) {
  Feed.findOne(criteria).exec(function(error, feed) {
    if (feed == null) {
      Feed.create(criteria)
        .then(function(feed) {
          callback(feed);
        })
        .fail(function(error) {
          throw error;
        });
    } else {
      callback(feed);
    }
  });
}

function feedForUrl(url, callback) {
  var foundMatch = false;

  for (var i = 0; i < feedMatchers.length && !foundMatch; i++) {
    var matcher = feedMatchers[i];
    if (matcher.isMatch(url)) {
      foundMatch = true;

      var criteria = {
        website: matcher.website,
        feedType: matcher.feedType,
        feedId: matcher.getFeedId()
      };
      findOrCreateFeed(criteria, callback);
    }
  }

  if (!foundMatch) {
    callback(null);
  }
}

var FeedModel = {
  attributes: {
    website: {
      type: 'string',
      enum: ['youtube']
    },

    url: {
      type: 'string'
    },

    feedType: {
      type: 'string',
      enum: ['channel']
    },

    feedId: {
      type: 'string'
    },

    users: {
      collection: 'user',
      via: 'feeds'
    }
  },

  fromUrl: function(url, callback) {
    feedForUrl(url, callback);
  }
};

module.exports = FeedModel;
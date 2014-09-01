var assert = require('chai').assert;
var helper = require('../helper');

describe('FeedModel', function() {
  before(function(done) {
    helper.liftSails(done);
  });

  after(function(done) {
    helper.lowerSails(done);
  });

  beforeEach(function(done) {
    helper.destroyAll(Feed, done);
  });

  it('should return a valid feed url', function(done) {
    Feed.create({
      site: 'youtube',
      feedType: 'channel',
      feedId: 'SomeUser'}, function(err, feed) {
      assert.ifError(err);
      assert.equal(feed.toUrl(), 'https://www.youtube.com/user/SomeUser/videos');
      done();
    })
  });
});
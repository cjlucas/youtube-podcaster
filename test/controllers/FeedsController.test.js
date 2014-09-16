var assert = require('chai').assert;
var expect = require('chai').expect;

var helper = require('../helper');

describe.only('FeedsController', function() {
  var agent;

  before(function(done) {
    helper.liftSails(function(err, sails) {
      agent = helper.getAgent(sails);
      // allow full access to api
      helper.loginWithAdminAuthority(agent, done);
    });

  });

  after(function(done) {
    helper.lowerSails(done);
    agent = null;
  });

  describe('#find()', function() {
    var feed;
    var videoIds;

    var getIds = function(models) {
      return models.map(function(model) {
        return model.id;
      })
    };

    var createFeedWithVideos = function(done) {
      var videos = [
        helper.validVideoCriteria(),
        helper.validVideoCriteria(),
        helper.validVideoCriteria()
      ];

      for (var i = 0; i < videos.length; i++) {
        videos[i].videoId = 'vid' + (i+1);
      }

      helper.series()
        .destroyAll(Feed)
        .destroyAll(Video)
        .createModels(Feed, helper.validFeedCriteria())
        .createModels(Video, videos)
        .end(function(err, results) {
          if (err) throw err;

          // last 4 elements are from createModels calls
          var models = results.slice(results.length - 4);
          feed = models[0];
          videos = models.slice(1);

          videoIds = getIds(videos);

          console.log(feed);
          // associate videos with feed
          for (var i = 0; i < videos.length; i++) {
            feed.videos.push(videos[i]);
          }

          feed.save(done);
        })
    };

    describe('when an id parameter is specified', function() {
      before(createFeedWithVideos);

      it('should return a feed when given valid id', function(done) {
        var id = feed.guid;
        agent
          .get('/api/feeds/' + id)
          .expect(200)
          .end(function(err, res) {
            assert.equal(res.body.guid, id);
            assert.ok(res.body.videos);
            assert.sameMembers(videoIds, getIds(res.body.videos));
            done();
          });
      });
    });

    describe('when no parameters are specified', function() {
      beforeEach(function(done) {
        helper.destroyAll(Feed, done);
      });

      it('should return an empty array if no feeds exist', function(done) {
        agent
          .get('/api/feeds')
          .expect(200)
          .end(function(err, res) {
            assert.ifError(err);
            assert.equal(res.body.length, 0);
            done();
          });
      });

      it('should return all feeds', function(done) {
        var feeds = [
          helper.validFeedCriteria(),
          helper.validFeedCriteria()
        ];

        helper.createModels(Feed, feeds, function() {
          agent
            .get('/api/feeds')
            .expect(200)
            .end(function(err, res) {
              assert.ifError(err);
              assert.equal(res.body.length, 2);
              done();
            });
        });
      });

      it('should return the videos for all feeds', function(done) {
        createFeedWithVideos(function() {
          agent
            .get('/api/feeds')
            .expect(200)
            .end(function(err, res) {
              assert.ifError(err);
              assert.equal(res.body.length, 1);
              assert.sameMembers(videoIds, getIds(res.body[0].videos));
              done();
            });
        });
      });
    });

  });

  describe('#addVideos()', function() {
    function addVideosRequest(feedId, videos) {
      return agent
        .post('/api/feeds/' + feedId + '/add_videos')
        .send({videos: videos})
    }

    var feed;

    beforeEach(function(done) {
      helper.series()
        .destroyAll(Feed)
        .destroyAll(Video)
        .createModels(Feed, helper.validFeedCriteria())
        .end(function(err, results) {
          if (err) return done(err);
          feed = results.slice(-1)[0];
          done();
        });
    });

    var videos = [
      helper.validVideoCriteria(),
      helper.validVideoCriteria()
    ];

    it('should add videos to a feed', function(done) {
      addVideosRequest(feed.guid, videos)
        .expect(200)
        .end(function(err, res) {
          assert.ifError(err);
          Feed.findOneById(feed.id).populate('videos')
            .exec(function(err, feed) {
              assert.ifError(err);
              expect(feed.videos).to.have.length(2);
              done();
            });
        });
    });

    it('should save given formats', function(done) {
      var video = helper.validVideoCriteria();
      video.formats.push({
        width: 1920,
        height: 1080,
        videoUrl: 'http://google.com/path/to/1080p.mp4'
      });

      addVideosRequest(feed.guid, [video])
        .expect(200)
        .end(function(err, res) {
          assert.ifError(err);
          Feed.findOneById(feed.id).populate('videos')
            .exec(function(err, feed) {
              assert.ifError(err);
              assert.lengthOf(feed.videos, 1);
              assert.lengthOf(feed.videos[0].formats, 2);
              done();
            })
        });
    });

    it('should return a 404 if an invalid feed id is given', function(done) {
        addVideosRequest(feed.guid + 1, videos).expect(404, done);
    });

    it('should update an existing video', function(done) {
      var video = helper.validVideoCriteria();
      // initial add videos request should create a new video object
      addVideosRequest(feed.guid, [video])
        .expect(200)
        .end(function(err, res) {
          assert.ifError(err);

          video.title = 'The title changed';
          video.formats[0].videoUrl = 'http://example.org/new_link.mp4';
          video.formats.push({
            width: 1920,
            height: 1080,
            videoUrl: 'http://google.com/path/to/1080p.mp4'
          });
          // second request should update the existing video
          // with the new title and new format entry
          addVideosRequest(feed.guid, [video])
            .expect(200)
            .end(function(err, res) {
              assert.ifError(err);
              Feed.findOneById(feed.id).populate('videos')
                .exec(function(err, feed) {
                  assert.ifError(err);
                  // assert video info was updated
                  assert.lengthOf(feed.videos, 1);
                  assert.equal(feed.videos[0].title , video.title);

                  assert.lengthOf(feed.videos[0].formats, 2);
                  // assert video link was updated
                  assert.deepEqual(feed.videos[0].formats[0], video.formats[0]);
                  // assert new format was added
                  assert.equal(feed.videos[0].formats[-1], video.formats[-1]);
                  done();
                });
            });
        })
    });
  });
});
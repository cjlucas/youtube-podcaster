/**
 * Load a feed when given an id, or return a 404 if a feed doesn't exist.
 *
 * This policy will provide req.feed to all actions that adopt it.
 *
 * @note This policy should be used in conjunction with requireIdParameter.
 */
module.exports = function(req, res, next) {
  Feed.findById(req.param('id'), function(err, feed) {
    if (err) return res.status(400).json({dbError: err});
    if (!feed) return res.status(404).json({error: 'Feed not found'});

    req.feed = feed;
    next();
  });
};
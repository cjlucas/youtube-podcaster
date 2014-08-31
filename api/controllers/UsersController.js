/**
 * UsersController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var UsersController = {

  create: function(req, res) {
    var email = req.param('email');
    var password = req.param('password');

    if (email == null || password == null) {
      return res
        .status(500)
        .json({error: 'email or password is missing.'});
    }

    User.findOneByEmail(email).exec(function(err, user) {
      if (user != null) {
        return res
          .status(500)
          .json({error: 'User with that email already exists.'});
      }

      User.create({email: email, password: password})
        .then(function(user) {
          res.json(user);
        })
        .fail(function(error) {
          console.error(error);
          res.status(500).json({error: 'Database Error: User creation failed.'})
        });
    })
  },

  login: function(req, res) {
    var email = req.param('email');
    var password = req.param('password');

    User.login(email, password, function(err, user) {
      if (err) {
        res.status(500).json({error: 'Passwords do not match.'})
      } else {
        console.log('Login Successful');
        req.session.user = user.email;
        res.status(200).end();
      }
    });
  },

  logout: function(req, res) {
    req.session.user = null;
    res.status(200).end();
  },

  addFeed: function(req, res) {
    var url = req.param('url');

    Feed.fromUrl(url, function onFeedLoad(feed) {
      this.currentUser.feeds.add(feed.id);

      this.currentUser.save(function(err) {
        if (err) {
          res.status(500).json({error: 'User already has this feed.'})
        }
        res.json(feed);
      });

    });
  }
};

module.exports = UsersController;

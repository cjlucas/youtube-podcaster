/**
 * SessionsController
 *
 * @description :: Server-side logic for managing sessions
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  // POST /login
  login: function(req, res) {
    var email = req.param('email');
    var password = req.param('password');

    User.login(email, password, function(err, user) {
      if (err) {
        res.status(403).json({error: err})
      } else {
        req.session.user = user.email;
        res.redirect('/');
      }
    });
  },

  // POST /logout
  logout: function(req, res) {
    req.session.user = null;
    res.status(200).end();
  }
};


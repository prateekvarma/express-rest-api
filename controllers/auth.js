const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    //if we have errors (coming from auth route)
    const error = new Error('Validation Failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      // create a new user
      const user = new User({
        email: email,
        password: hashedPw,
        name: name
      });
      return user.save();
    })
    .then((result) => {
      res.status(201).json({ message: 'User created!', userId: result._id });
    })
    .catch((err) => {
    if(!err.statusCode) {
      err.statusCode = 500; //if no errors yet, this error shold be a server error
    }
    next(err);
  });
  
};

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  User.findOne({ email: email }) //find the user from DB
      .then((user) => {
        if(!user) {
          const error = new Error('Could not find user with that email');
          error.statsCode = 401;
          throw error;
        }
        //we found the user
        loadedUser = user;
        return bcrypt.compare(password, user.password);
      })
      .then((isEqual) => {
        //isEqual is a promise returned by 'bcrypt.compare'
        if(!isEqual) {
          const error = new Error('Wrong password');
          error.statusCode = 401;
          throw error;
        }
        // reached here, the password should have matched
        // **Create a JWT token**
      })
      .catch((err) => {
        if(!err.statusCode) {
          err.statusCode = 500; //if no errors yet, this error shold be a server error
        }
        next(err);
      });
};
const express = require('express');
const { body } = require('express-validator') //using body because we want to check the request body

const User  = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.put('/signup', [
    body('email')
      .isEmail() //these chains are validations
      .withMessage('Please enter a valid email')
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if(userDoc) {
            return Promise.reject('Email address already exists'); // Rejecting a promise, as in it's an error.
          }
        });
      })
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength({ min: 5 }),
    body('name')
      .trim()
      .not().isEmpty()
  ],
  authController.signup
);

router.post('/login');

module.exports = router;
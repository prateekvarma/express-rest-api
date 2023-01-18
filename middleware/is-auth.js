const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if(!authHeader) {
    const error = new Error('JWT token not found!');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(' ')[1]; //Authorization format will be 'Bearer gekjrgjebg'. So just the 'gekjrgjebg' is extracted.

  try {
    decodedToken = jwt.verify(token, 'secret');
  } catch (error) {
    error.statusCode = 500;
    throw error;
  }

  if(!decodedToken) {
    //wasn't able to verify
    const error = new Error('Authentication Failed!');
    error.statusCode = 401;
    throw error;
  }

  //if reached here, the token is valid
  req.userId = decodedToken.userId; //construct the request object.
  next();
}
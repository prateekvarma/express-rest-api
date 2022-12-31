const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    res.status(200).json({ 
        posts: [
            {
                _id: '1',
                title: 'First Post',
                content: 'This is the first post content',
                imageURL: 'images/puppy.jpg',
                creator: {
                    name: 'Prateek'
                },
                createdAt: new Date()
            }  
        ] 
    });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req); //auto extracts any errors from request
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422; //custom property
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    const post = new Post({
        title: title, 
        content: content,
        imageUrl: 'images/puppy.jpg',
        creator: { name: 'Prateek' }
    });
    console.log('sending to DB:', post);
    //Below, we save the post on MongoDB
    post.save()
    .then((result) => {
        res.status(201).json({
            message: 'Post created successfully!',
            post: result
        });
    })
    .catch((err) => {
        if(!err.statusCode) {
            err.statusCode = 500; //if no errors yet, this error shold be a server error
        }
        next(err); //passing on the error to the next middleware, as it's the end of the promise chain. Otherwise, we would have said "throw err"
    });

};
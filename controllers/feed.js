const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    Post.find()
    .then((posts) => {
        res.status(200).json({ message: 'Fetched posts success!', posts: posts })
    })
    .catch((err) => {
        if(!err.statusCode) {
            err.statusCode = 500; //if no errors yet, this error shold be a server error
        }
        next(err);
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

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId)
        .then((post) => {
            if (!post) {
                const error = new Error('Could not find post')
                error.statusCode = 404;
                throw error; //this error is caught by the following catch block
            }
            res.status(200).json({ message: 'Post fetched!', post: post });
        })
        .catch((err) => {
            if(!err.statusCode) {
            err.statusCode = 500; //if no errors yet, this error shold be a server error
        }
        next(err);
    });
}
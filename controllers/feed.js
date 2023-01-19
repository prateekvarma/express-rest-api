const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1; //extract from query params, for pagination 
    const perPage = 2;
    let totalItems;

    Post.find()
    .countDocuments()
    .then((count) => {
        totalItems = count;
        return Post.find()
                    .skip((currentPage - 1) * perPage)
                    .limit(perPage);
    })
    .then((posts) => {
        res.status(200).json({ message: 'Fetched posts success!', posts: posts, totalItems:totalItems })
    })
    .catch((err) => {
        if(!err.statusCode) {
            err.statusCode = 500; //if no errors yet, this error shold be a server error
        }
        next(err);
    })
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req); //auto extracts any errors from request
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422; //custom property
        throw error;
    }

    if(!req.file) {
        const error = new Error('No image provided!');
        error.statusCode = 422;
        throw Error;
    }

    const imageUrl = req.file.path;

    const title = req.body.title;
    const content = req.body.content;
    let creator;

    const post = new Post({
        title: title, 
        content: content,
        imageUrl: imageUrl,
        creator: req.userId // The 'req.userId' comes from 'decodedToken.userId' from is-auth.js
    });
    
    //Below, we save the post on MongoDB
    post.save()
    .then((result) => { //find the user associated with post
        return User.findById(req.userId)
    })
    .then((user) => {
        creator = user;
        user.posts.push(post); //add the new post to the previous list of posts
        return user.save();
    })
    .then((result) => {
        res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: { _id: creator._id, name: creator.name }
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

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;

    const errors = validationResult(req); //auto extracts any errors from request
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422; //custom property
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image; // if imageUrl is part of the incoming request, and NO new file was selected, the frontend has the existing imageUrl
    if (req.file) { // new image uploaded
        imageUrl = req.file.path;
    }
    if(!imageUrl) {
        const error = new Error('You havent selected a file');
        error.statusCode = 422;
        throw error;
    }

    //we have valid data
    Post.findById(postId).then((post) => {
        if(!post) {
            const error = new Error('Could not find post')
            error.statusCode = 404;
            throw error; //this error is caught by the following catch block
        }
        //we've found the post
        if(post.creator.toString() !== req.userId) { //'req.userId' from is-auth.js
            //this post doesn't belong to the authenticated user
            const error = new Error('Not authorized');
            error.status = 403;
            throw error;
        }
        if(imageUrl !== post.imageUrl) {
            //if there is a change in the previous img and the current one
            clearImage(post.imageUrl); // delete the previous img
        }
        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;
        return post.save(); //saved to DB
    }).then((result) => {
        res.status(200).json({ message: 'Post updated!', post: result });
    }).catch((err) => {
        if(!err.statusCode) {
            err.statusCode = 500; //if no errors yet, this error shold be a server error
        }
        next(err);
    })
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId).then((post) => {
        if (!post) {
            const error = new Error('Could not find post')
            error.statusCode = 404;
            throw error; //this error is caught by the following catch block
        }

        clearImage(post.imageUrl);
        return Post.findByIdAndRemove(postId);
    }).then((result) => {
        console.log('Result from deleting: ', result);
        res.status(200).json({ message: 'Deleted post!' })
    }).catch((err) => {
        if(!err.statusCode) {
            err.statusCode = 500; //if no errors yet, this error shold be a server error
        }
        next(err);
    });
}

//Below, can be called whenever user uploads a new image.
const clearImage = (filePath) => {
    filePath = path.join(__dirname, '..', filePath); //the latter filePath is from the args. This will be like 'images/xxx.jpg'
    fs.unlink(filePath, (err) => console.log("Error deleting image: ", err));
}
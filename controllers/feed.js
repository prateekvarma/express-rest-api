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
    const title = req.body.title;
    const content = req.body.content;
    res.status(201).json({
        message: 'Post created successfully!',
        post: { id: new Date().toISOString(), title: title, content: content }
    });
};
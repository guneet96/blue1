const express = require('express');
const router = express.Router();
const { check, validationResult } = require("express-validator/check");
const auth = require("../../middleware/auth");

const Post = require("../../models/Posts");
const Profile = require("../../models/Profile");
const User = require("../../models/Users");

// @route POST api/post
// create a post
// it has to be private
router.post('/', [auth, [
    check('text', 'Text is required').not().isEmpty()
    ]
] , async (req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try{
        const user =  await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        });

        const post = await newPost.save()
        res.json(post);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route GET api/posts
// get all posts
// private
router.get("/", auth, async (req,res) => {
    try{
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch(err)
    {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route GET api/posts/:id
// get post by id
// private
router.get("/:id", auth, async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);
        
        if(!post) {
            return res.status(404).json({ msg: "Post not found "});
        }

        res.json(post);
    } catch(err)
    {
        if(err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Post not found "});
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route Delete api/posts/:id
// delete a post by ID
// private
router.delete("/:id", auth, async (req,res) => {
    try{
        const post = await Post.findById(req.params.id);

        // check user and owner of the post
        if(post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: "User not authorized"});
        }
        if(!post) {
            return res.status(404).json({ msg: "Post not found "});
        }
        await post.remove();

        res.json({ msg: "Post removed"});
    } catch(err)
    {
        if(err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Post not found "});
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// for likes
// @route PUT api/posts/like/:id
// like a post
// private
router.put('/like/:id', auth, async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        
        // check if post has already been liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: "Post already liked"});
        }

        post.likes.unshift({ user: req.user.id});
        await post.save();

        res.json(post.likes);

    } catch(err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});



// for unlike
// @route PUT api/posts/unlike/:id
// like a post
// private
router.put('/unlike/:id', auth, async (req, res) => {
    try{
        const post = await Post.findById(req.params.id);
        
        // check if post has already been liked
        if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: "Post has not yet been liked"});
        }

        // GET remove index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);
        await post.save();

        res.json(post.likes);

    } catch(err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});


// for comments
// @route POST api/posts/comments/:id
// add a comment on a post
// private
router.post('/comment/:id', [auth, [
    check('text', 'Text is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try{
        const user =  await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        }

        post.comments.unshift(newComment);

        await post.save()
        res.json(post.comments);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
    



// for deleting comments
// @route DELETE api/posts/comments/:id/:comment_id
// delete a comment on a post
// private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {

    try{
        const user =  await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        // pull out comment from the post
        const comment = post.comments.find(comment => comment.id === req.params.comment_id);

        // make sure the comment exists
        if(!comment) {
            // not found
            return res.status(404).json({ msg : "Comment does not exists."});
        }

        // check the author of the comment
        if(comment.user.toString() !== req.user.id) {
            // unauthorizes
            return res.status(401).json({ msg: "User not authorized"});
        }

        // GET remove index
        const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);
        await post.save();
 
        res.json(post.comments);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports =  router;
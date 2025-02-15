const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const Profile = require("../../models/Profile");
const User = require("../../models/Users");
const { check, validationResult } = require('express-validator/check');
const request = require("request");
const config = require("config");

// @route GET api/profile
// to get current users profile
// @access current user's profile has to be private, obviously

// to protect routes, add auth as a second parameter
router.get('/me', auth, async (req,res) => {
// mongoose returns a promise that is why we use async and await
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if(!profile) {
            return res.status(400).json({ msg: "There is no profile for this user." });
        }

        res.json(profile);
        
    } catch (err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


// @route POST api/profile
// to create and update user profile
// @access current user's profile has to be private, obviously

// to use multiple middlewares, put them in an array
router.post('/', [ auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills','Skills is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        gitusername,
        skills,
        youtube,
        facebook,
        twitter,
        linkedin
    } = req.body;

    // build profile object

    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (gitusername) profileFields.gitusername = gitusername;
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    //console.log(skills);
    //console.log(profileFields);
    }

// build social object 
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedin) profileFields.social.linkedin = linkedin;

    //console.log(profileFields);
    // res.send("added");

    try{
        let profile = await Profile.findOne({ user : req.user.id });
        
        // if profile is found, update that profile using mongoose, make sure to use await because mongoose methods sends a promise
        if(profile) {
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
            return res.json(profile);
        }

        // if profile is not found, create it
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);


        // 
    }catch(err) {
        console.error(err.message);
        res.status(500).send("Server error");
    }
});


// @route GET api/profile
// get all profiles of the developers in the system
//  this information is going to be public
router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route GET api/profile/user/:user_id
// get profile by user ID
//  this information is going to be public
router.get("/user/:user_id", async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        
        if(!profile) {
            return res.status(400).json({ msg: "Profile not found"});
        }
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId') {
            return res.status(400).json({ msg: "Profile not found"});
        }
        res.status(500).send('Server Error');
    }
});


// @route DELETE api/profile
// delete profile, users and all their posts
// this is going to be a private operation
router.delete("/", auth, async (req, res) => {
    try {
        // todo, remove users posts as well
        //await Posts.findOneAndRemove({ user: req.user.id });
        // remove profile
        await Profile.findOneAndRemove({ user: req.user.id });
        // remove user
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: "User deleted"});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route PUT api/profile/experience
// add profile experience
// private cuz it will be everyone's own experience
router.put("/experience", [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }
    
    // try catch is to deal with mongoDB
    try {
        // find the profile by user id
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience.unshift(newExp);
        await  profile.save()
        res.json({profile});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route DELETE api/profile/experience/:exp_id
// delete experience from the profile 
// this is going to be a private operation, obviously
router.delete("/experience/:exp_id", auth, async (req, res) => {
    
    // using try cathc for database handling
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // get the remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);
        await profile.save()
        res.json({profile});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route PUT api/profile/education
// add profile education
// private cuz it will be everyone's own education
router.put("/education", [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }
    
    // try catch is to deal with mongoDB
    try {
        // find the profile by user id
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newEdu);
        await  profile.save()
        res.json({profile});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route DELETE api/profile/education/:edu_id
// delete education from the profile 
// this is going to be a private operation, obviously
router.delete("/education/:edu_id", auth, async (req, res) => {
    
    // using try cathc for database handling
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // get the remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);
        await profile.save()
        res.json({profile});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route GET api/profile/github/:username
// get git repos of registered users from github
// public
router.get("/github/:username", (req,res) => {
    try{
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get("githubSecret")}`,
            method: "GET",
            headers: { 'user-agent': 'node.js' }
        }
        const username = req.params.username;
        // console.log(username);
        // console.log(config.get("githubSecret"));
        // console.log(config.get('githubClientId'));
        request(options, (error, response, body) => {
            if(error) console.error(error);
            if(response.statusCode !== 200) {
                return res.status(404).json({ msg: "No Github profile found"});
            }

            res.json(JSON.parse(body));
        });
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});




module.exports =  router;
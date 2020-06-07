const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/Users');
const {check, validationResult } = require('express-validator/check');
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');


// @route post request to api/auth
// for authentication of users and getting the token
// public access
router.post('/', [
    check('email','Please include a valid email address ').isEmail(),
    check('password', 'Password is required').exists()
], 
async (req,res) => { 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // check if user exists
        let user = await User.findOne({ email });

         if(!user) {
             return res.status(400).json({ errors: [ { msg: "Invalid Credentials" } ]});
         }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if(!isMatch) {
            return res.status(400).json({ errors: [ { msg: "Invalid Credentials" } ]});
        }

        


        const payload = {
             user: {
                 id: user.id
             }
        };

         jwt.sign(
             payload,
             config.get("jwtSecret"), 
             { expiresIn: 360000 }, 
            (err, token) => {
                // console.log("in sign"); 
                if(err) throw err;
                // console.log("if crossed");
                console.log(token);
                res.json({ token });
            } 
         );

         
        // return jwt

        // console.log(req.body);
        // console.log(req.params)
        // res.send("Users Route");
    } catch(err) {
        console.error(err.message);
        res.status(500).send("Server error!");
    }
    }
);

module.exports =  router;
// @route GET api/auth
// @access public
router.get('/', auth, async (req,res) => {
    try{
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }catch(err){
        console.error(err.message);
        res.status(500).send('Server Error!');
    }
});

module.exports =  router;
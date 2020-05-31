const express = require('express');
const router = express.Router();
const {check, validationResult } = require('express-validator/check');
const User = require('../../models/Users'); 
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
// @route GET api/users
// for registering users
// @access public
router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('email','Please include a valid email address ').isEmail(),
    check('password', 'Please include a password of minimum 4 characters.').isLength({min: 4})
], 
async (req,res) => { 
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {

        // check if user exists
        let user = await User.findOne({ email });

         if(user) {
             return res.status(400).json({ errors: [ { msg: "User already exists" } ]});
         }
         // get users gravatar
         const avatar = gravatar.url(email, {
             s: '200',
             r:'pg',
             d:'mm'
         })

         // user instance created
         user = new User({
             name, email, avatar, password
         })

         // encrypt their password using bcrypt
         const salt = await bcrypt.genSalt(9);
         user.password = await bcrypt.hash(password, salt);
         await user.save();
         console.log(user.password)

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
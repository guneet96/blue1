const jwt = require('jsonwebtoken');
const config = require('config');


module.exports = function (req, res, next) {
    // get the token from the header
    const token = req.header('x-auth-token');
    console.log('working/?')
    console.log(token);

    // check if no token
    if(!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // verify the authenticy of the token
    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));
        console.log(decoded);
        // setting the session
        req.user = decoded.user;
        next();
    } catch(err) {
        console.warn(err.msg);
        res.status(401).json({ msg: "Sorry! Token is not valid." });
    }
}
const express = require("express");
const connectDB  = require('./config/db');
const app = express();
//console.log("yahan tak chal gaya");
// Connect Database 
connectDB();

app.get('/', (req,res) => res.send('API Deployed on Heroku and Running')); 

// inntialize middleware
app.use(express.json({ extended: false }));

// Routes are defined here
app.use('/api/users', require('./routes/api/users'))
app.use('/api/profile', require('./routes/api/profile'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/posts', require('./routes/api/posts'))

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on ${PORT} `));
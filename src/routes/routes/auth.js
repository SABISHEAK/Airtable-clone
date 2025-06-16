// authentication routes - handles login and signup
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';

// signup route
router.post('/register', [
  body('email').isEmail().normalizeEmail(), // validate email format
  body('password').isLength({ min: 6 })     // password must be at least 6 chars
], async (req, res) => {
  try {
    // check if validation failed
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // see if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Someone already registered with this email' });
    }

    // hash the password so we don't store it in plain text
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // create new user
    const newUser = new User({ 
      email, 
      password: hashedPassword 
    });
    await newUser.save();

    // create JWT token for the user
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email }, 
      jwtSecret
    );
    
    // send back token and user info
    res.status(201).json({ 
      token, 
      user: { id: newUser._id, email: newUser.email } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Wrong email or password' });
    }

    // check if password matches
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(400).json({ error: 'Wrong email or password' });
    }

    // create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email }, 
      jwtSecret
    );
    
    // send back token and user info
    res.json({ 
      token, 
      user: { id: user._id, email: user.email } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
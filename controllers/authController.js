const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super-secret-key-for-dev', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    // Remove password from output
    newUser.password = undefined;

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'Please provide email and password' });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
    }

    // 3) If everything ok, send token to client
    const token = signToken(user._id);

    // Send back user info (without password) alongside the token
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ status: 'fail', message: 'You are not logged in! Please log in to get access.' });
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-for-dev');

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ status: 'fail', message: 'The user belonging to this token does no longer exist.' });
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({ status: 'fail', message: 'Invalid token or token expired' });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['Admin', 'Manager'] etc
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'fail', message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

exports.getMe = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
};

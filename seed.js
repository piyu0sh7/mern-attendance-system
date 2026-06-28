require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB for seeding...');

    // Clear existing users to avoid duplicates
    await User.deleteMany({});
    
    const hashedPassword = await bcrypt.hash('password123', 12);

    const users = [
      { name: 'Admin User', email: 'admin@test.com', password: hashedPassword, role: 'Admin' },
      { name: 'Manager User', email: 'manager@test.com', password: hashedPassword, role: 'Manager' },
      { name: 'Employee User', email: 'employee@test.com', password: hashedPassword, role: 'Employee' }
    ];

    await User.insertMany(users);
    console.log('Database successfully seeded with 3 test users!');
    console.log('Passwords for all users: password123');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

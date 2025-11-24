const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AccessPoint = require('./models/AccessPoint');
const Ticket = require('./models/Ticket');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-campus-wifi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected for Seeding');

  // Clear existing data
  await AccessPoint.deleteMany({});
  await Ticket.deleteMany({});
  await User.deleteMany({});

  // Create Admin User
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  const adminUser = new User({
    username: 'admin',
    email: 'admin@campus.edu',
    password: hashedPassword,
    role: 'admin'
  });
  await adminUser.save();

  // Create Student User
  const hashedStudentPassword = await bcrypt.hash('student123', salt);
  const studentUser = new User({
    username: 'student',
    email: 'student@campus.edu',
    password: hashedStudentPassword,
    role: 'student'
  });
  await studentUser.save();

  // Seed Access Points
  const accessPoints = [
    { name: 'AP-Lib-01', location: 'Library 1F', status: 'Online', ipAddress: '192.168.1.101', load: 45 },
    { name: 'AP-Lib-02', location: 'Library 2F', status: 'Online', ipAddress: '192.168.1.102', load: 60 },
    { name: 'AP-Dorm-A', location: 'Dorm A Hall', status: 'Offline', ipAddress: '192.168.1.201', load: 0 },
    { name: 'AP-Dorm-B', location: 'Dorm B Hall', status: 'Online', ipAddress: '192.168.1.202', load: 80 },
    { name: 'AP-Cafe', location: 'Cafeteria', status: 'Online', ipAddress: '192.168.1.301', load: 90 },
    { name: 'AP-Sci-01', location: 'Science Bldg 1F', status: 'Online', ipAddress: '192.168.1.401', load: 20 },
    { name: 'AP-Sci-02', location: 'Science Bldg 2F', status: 'Offline', ipAddress: '192.168.1.402', load: 0 },
    { name: 'AP-Admin', location: 'Admin Block', status: 'Online', ipAddress: '192.168.1.501', load: 10 },
    { name: 'AP-Gym', location: 'Gymnasium', status: 'Online', ipAddress: '192.168.1.601', load: 30 },
    { name: 'AP-Aud', location: 'Auditorium', status: 'Online', ipAddress: '192.168.1.701', load: 5 }
  ];

  await AccessPoint.insertMany(accessPoints);

  // Seed Tickets
  const tickets = [
    { issueType: 'Connectivity', location: 'Dorm A Hall', description: 'No signal in room 101', status: 'New', createdBy: studentUser._id },
    { issueType: 'Speed', location: 'Library 1F', description: 'Internet is very slow', status: 'In Progress', createdBy: studentUser._id },
    { issueType: 'Login', location: 'Cafeteria', description: 'Cannot login to portal', status: 'Resolved', createdBy: studentUser._id },
    { issueType: 'Connectivity', location: 'Science Bldg 2F', description: 'AP seems to be down', status: 'New', createdBy: studentUser._id },
    { issueType: 'Other', location: 'Gym', description: 'Request for guest access', status: 'New', createdBy: studentUser._id }
  ];

  await Ticket.insertMany(tickets);

  console.log('Data Seeded Successfully');
  process.exit();
})
.catch(err => {
  console.log(err);
  process.exit(1);
});

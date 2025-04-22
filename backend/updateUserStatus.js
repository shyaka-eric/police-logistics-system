const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/logistics', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  try {
    // First, let's check current user statuses
    const users = await User.find({}, 'name email status');
    console.log('Current users:', users);

    // Update all users to active status
    const result = await User.updateMany(
      {},  // Update all users
      { $set: { status: 'active' } }
    );
    
    console.log(`Updated ${result.modifiedCount} users to active status`);

    // Verify the update
    const updatedUsers = await User.find({}, 'name email status');
    console.log('Updated users:', updatedUsers);
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    mongoose.connection.close();
  }
})
.catch(err => console.error('MongoDB connection error:', err)); 
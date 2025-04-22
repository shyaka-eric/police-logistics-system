const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/logistics', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['Unit Leader', 'Admin', 'Logistics Officer'] },
  unit: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

const stockSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  minQuantity: { type: Number, required: true },
  location: { type: String, required: true },
  status: { type: String, required: true, enum: ['Available', 'Low Stock', 'Out of Stock'] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdated: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Stock = mongoose.model('Stock', stockSchema);

async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Stock.deleteMany({});

    // Create users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const unitLeaderPassword = await bcrypt.hash('leader123', 10);
    const logisticsPassword = await bcrypt.hash('logistics123', 10);

    const admin = await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'Admin',
      unit: 'Headquarters',
      email: 'admin@example.com'
    });

    const unitLeader = await User.create({
      username: 'leader',
      password: unitLeaderPassword,
      role: 'Unit Leader',
      unit: 'Alpha Company',
      email: 'leader@example.com'
    });

    const logisticsOfficer = await User.create({
      username: 'logistics',
      password: logisticsPassword,
      role: 'Logistics Officer',
      unit: 'Logistics Unit',
      email: 'logistics@example.com'
    });

    // Create stock items
    const stockItems = [
      {
        itemName: 'Rifle',
        category: 'Weapons',
        quantity: 50,
        unit: 'pieces',
        minQuantity: 10,
        location: 'Armory A',
        status: 'Available',
        updatedBy: logisticsOfficer._id
      },
      {
        itemName: 'Ammunition',
        category: 'Ammunition',
        quantity: 1000,
        unit: 'rounds',
        minQuantity: 200,
        location: 'Armory B',
        status: 'Available',
        updatedBy: logisticsOfficer._id
      },
      {
        itemName: 'First Aid Kit',
        category: 'Medical',
        quantity: 5,
        unit: 'kits',
        minQuantity: 10,
        location: 'Medical Storage',
        status: 'Low Stock',
        updatedBy: logisticsOfficer._id
      },
      {
        itemName: 'Rations',
        category: 'Food',
        quantity: 200,
        unit: 'meals',
        minQuantity: 50,
        location: 'Storage Room 1',
        status: 'Available',
        updatedBy: logisticsOfficer._id
      }
    ];

    await Stock.insertMany(stockItems);

    console.log('Database seeded successfully!');
    console.log('Created users:');
    console.log('- Admin:', admin.username);
    console.log('- Unit Leader:', unitLeader.username);
    console.log('- Logistics Officer:', logisticsOfficer.username);
    console.log('\nCreated stock items:', stockItems.length);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase(); 
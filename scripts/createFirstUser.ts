import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

async function createFirstUser() {
  try {
    await connectDB();
    const existingUser = await User.findOne();
    if (existingUser) {
      console.log('✅ Users already exist in the database. Exiting.');
      process.exit(0);
    }
    const hashedPassword = await bcrypt.hash('Admin@123', 12);
    await User.create({
      name: 'System Administrator',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'Admin',
      authProvider: 'credentials',
      isActive: true,
    });

    console.log('✅ First admin user created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: Admin@123');
    console.log('\n⚠️  IMPORTANT: Change these credentials immediately after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create first user:', error);
    process.exit(1);
  }
}

createFirstUser();
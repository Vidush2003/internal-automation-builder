// seed-admin.js
// Run this script ONCE to create a SUPER_ADMIN user in your production MongoDB Atlas database.
// Usage: MONGO_URI="mongodb+srv://..." node seed-admin.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ Error: MONGO_URI environment variable is not set.');
  console.error('Usage: MONGO_URI="your-atlas-uri" node seed-admin.js');
  process.exit(1);
}

// --- Admin user config (edit before running) ---
const ADMIN_NAME     = 'Super Admin';
const ADMIN_EMAIL    = 'admin@yourdomain.com';  // ← change this
const ADMIN_PASSWORD = 'ChangeMe123!';          // ← change this
// ------------------------------------------------

const ROLE_VALUES = ['SUPER_ADMIN', 'ADMIN', 'AUTOMATION_MANAGER', 'TEAM_LEAD', 'EMPLOYEE'];

const userSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role:         { type: String, enum: ROLE_VALUES, default: 'EMPLOYEE' },
    orgId:        { type: mongoose.Schema.Types.ObjectId, default: null },
    isActive:     { type: Boolean, default: true },
    lastLoginAt:  { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() }).lean();
  if (existing) {
    console.log(`⚠️  User "${ADMIN_EMAIL}" already exists (role: ${existing.role}). Skipping.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    role: 'SUPER_ADMIN',
    isActive: true,
  });

  console.log('🎉 SUPER_ADMIN user created successfully!\n');
  console.log('─────────────────────────────────────────');
  console.log(`  Email   : ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  Role    : SUPER_ADMIN`);
  console.log('─────────────────────────────────────────');
  console.log('\n⚠️  Change your password after first login!\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});

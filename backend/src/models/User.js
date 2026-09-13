// src/models/User.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { DEFAULT_ROLE, ROLE_VALUES } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      maxlength: [255, 'Email cannot exceed 255 characters'],
    },

    passwordHash: {
      type: String,
      required: false,
      select: false,
    },

    googleId: { type: String, sparse: true, index: true },
    githubId: { type: String, sparse: true, index: true },
    
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },
    
    magicLinkToken: { type: String, select: false },
    magicLinkExpire: { type: Date, select: false },

    role: {
      type: String,
      enum: ROLE_VALUES,
      default: DEFAULT_ROLE,
      index: true,
    },

    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    minimize: false,
  }
);



userSchema.pre('save', async function savePassword() {
  if (!this.isModified('passwordHash') || !this.passwordHash) {
    return;
  }
  const saltRounds = 12;
  this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    orgId: this.orgId ? this.orgId.toString() : null,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

userSchema.set('toJSON', {
  transform: function transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model('User', userSchema);
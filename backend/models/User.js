const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    githubUsername: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    avatarUrl: {
      type: String,
      default: ''
    },
    githubAccessToken: {
      type: String,
      required: true
    },
    selectedRepository: {
      type: String,
      trim: true,
      default: ''
    },
    selectedBranch: {
      type: String,
      trim: true,
      default: 'main'
    },
    autoSave: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);

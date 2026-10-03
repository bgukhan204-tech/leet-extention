const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    problemNumber: {
      type: Number,
      required: true,
      index: true
    },
    problemTitle: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
      index: true
    },
    language: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true
    },
    githubPath: {
      type: String,
      required: true
    },
    githubCommitSha: {
      type: String,
      default: ''
    },
    githubCommitUrl: {
      type: String,
      default: ''
    },
    timeComplexity: {
      type: String,
      default: 'O(n)'
    },
    spaceComplexity: {
      type: String,
      default: 'O(1)'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound index to quickly find user solutions for a problem
solutionSchema.index({ userId: 1, problemNumber: 1, language: 1 });

module.exports = mongoose.model('Solution', solutionSchema);

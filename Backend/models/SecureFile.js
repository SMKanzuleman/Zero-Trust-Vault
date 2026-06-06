const mongoose = require('mongoose');

const secureFileSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: [true, 'File name is required.'],
      trim: true,
    },
    fileData: {
      type: Buffer,
      required: [true, 'File data buffer is required.'],
    },
    fileHash: {
      type: String,
      required: [true, 'File SHA256 hash is required for integrity checks.'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required.'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required.'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

secureFileSchema.index({ uploadedBy: 1 });

const SecureFile = mongoose.model('SecureFile', secureFileSchema);

module.exports = SecureFile;

const mongoose = require('mongoose');

const backupFileSchema = new mongoose.Schema(
  {
    secureFileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SecureFile',
      required: [true, 'SecureFile reference is required.'],
      unique: true, // 1-to-1 relationship
    },
    backupData: {
      type: Buffer,
      required: [true, 'Pristine backup buffer is required for recovery.'],
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

backupFileSchema.index({ secureFileId: 1 });

const BackupFile = mongoose.model('BackupFile', backupFileSchema);

module.exports = BackupFile;

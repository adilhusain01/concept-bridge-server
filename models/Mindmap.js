const mongoose = require("mongoose");

const mindmapSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
  },
  topic: {
    type: String,
    required: true,
  },
  mermaidCode: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Mindmap", mindmapSchema);

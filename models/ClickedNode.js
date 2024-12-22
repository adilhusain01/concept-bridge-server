const mongoose = require("mongoose");

const clickedNodeSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    lowercase: true,
  },
  topic: {
    type: String,
    required: true,
  },
  nodeText: {
    type: String,
    required: true,
  },
  clickedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ClickedNode", clickedNodeSchema);

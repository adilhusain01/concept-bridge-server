const express = require("express");
const router = express.Router();
const mindmapController = require("../controllers/mindmapController");

router.post("/generate-mindmap", mindmapController.generateMindmap);
router.post("/get-node-info", mindmapController.getNodeInfo);
router.get("/user-mindmaps/:walletAddress", mindmapController.getUserMindmaps);
router.get(
  "/mindmap/:walletAddress/:topic",
  mindmapController.getMindmapByTopic
);
router.post("/track-node-click", mindmapController.trackNodeClick);
router.get(
  "/clicked-nodes/:walletAddress/:topic",
  mindmapController.getClickedNodes
);
router.delete(
  "/delete-mindmap/:walletAddress/:topic",
  mindmapController.deleteMindmap
);

module.exports = router;

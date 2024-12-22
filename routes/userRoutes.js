const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/check-user", userController.checkUser);
router.post("/register", userController.registerUser);
router.get(
  "/activity/:walletAddress/:month/:year",
  userController.getUserActivityData
);
router.get("/profile/:walletAddress", userController.getUserProfile);

module.exports = router;

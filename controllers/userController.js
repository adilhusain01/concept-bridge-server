const User = require("../models/User");
const UserActivity = require("../models/UserActivity");

const userController = {
  checkUser: async (req, res) => {
    try {
      const { walletAddress } = req.body;
      const user = await User.findOne({
        walletAddress: walletAddress.toLowerCase(),
      });
      res.json({ exists: !!user, user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  registerUser: async (req, res) => {
    try {
      const { walletAddress, username } = req.body;

      // Check if username already exists
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const user = new User({
        walletAddress: walletAddress.toLowerCase(),
        username,
      });

      await user.save();
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserActivityData: async (req, res) => {
    try {
      const { walletAddress, month, year } = req.params;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const activities = await UserActivity.find({
        walletAddress: walletAddress.toLowerCase(),
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      }).select("date -_id");

      res.json(activities);
    } catch (error) {
      console.error("Error fetching user activity data:", error);
      res.status(500).json({ error: "Failed to fetch activity data" });
    }
  },

  getUserProfile: async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await User.findOne({
        walletAddress: walletAddress.toLowerCase(),
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  },
};

module.exports = userController;

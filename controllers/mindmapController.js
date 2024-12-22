const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
const Mindmap = require("../models/Mindmap");
const ClickedNode = require("../models/ClickedNode");
const UserActivity = require("../models/UserActivity");

const cleanMermaidCode = (text) => {
  return text
    .replace(/```mermaid\n?/g, "")
    .replace(/```\s*$/g, "")
    .trim();
};

exports.generateMindmap = async (req, res) => {
  try {
    const { topic, walletAddress } = req.body;

    // Check if mindmap already exists for this topic and wallet
    const existingMindmap = await Mindmap.findOne({
      walletAddress: walletAddress.toLowerCase(),
      topic,
    });

    if (existingMindmap) {
      return res.json({
        mermaidCode: existingMindmap.mermaidCode,
        isExisting: true,
      });
    }

    const prompt = `Given the topic "${topic}", create a Mermaid mindmap diagram showing the main concepts and their relationships.
    The diagram should have:
    1. A clear hierarchy of topics and subtopics
    2. Meaningful connections between related concepts
    3. Leaf nodes that can be expanded further
    4. No more than 3 levels of depth initially
    
    Respond with ONLY the Mermaid mindmap code between triple backticks with 'mermaid' tag.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanedCode = cleanMermaidCode(response.text());

    // Save the new mindmap
    const mindmap = new Mindmap({
      walletAddress: walletAddress.toLowerCase(),
      topic,
      mermaidCode: cleanedCode,
    });
    await mindmap.save();

    res.json({ mermaidCode: cleanedCode, isNew: true });
  } catch (error) {
    console.error("Error generating mindmap:", error);
    res.status(500).json({ error: "Failed to generate mindmap" });
  }
};

const cleanExplanation = (explanation) => {
  const sections = explanation
    .split("\n")
    .filter((section) => section.trim() !== "");
  return {
    briefExplanation: sections[0] || "",
    example: sections[1] || "",
    keyTakeaway: sections[2] || "",
  };
};

exports.getNodeInfo = async (req, res) => {
  try {
    const { nodeText, parentContext, walletAddress } = req.body;

    // Generate explanation using existing code
    const prompt = `Given the concept "${nodeText}" in the context of "${parentContext}", provide:
    1. A brief explanation (2-3 sentences)
    2. One concrete example that you explain someone like he is a child
    3. Key takeaway
    
    Keep the response concise and focused plus dont include heading for all three point at their start and separate them with a new line.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const cleanedExplanation = cleanExplanation(response.text());

    // Track user activity
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Try to update existing record for today
      const updatedActivity = await UserActivity.findOneAndUpdate(
        {
          walletAddress: walletAddress.toLowerCase(),
          date: today,
        },
        {},
        { new: true }
      );

      // If no existing record, create new one
      if (!updatedActivity) {
        await UserActivity.create({
          walletAddress: walletAddress.toLowerCase(),
          date: today,
        });
      }
    } catch (activityError) {
      console.error("Error tracking user activity:", activityError);
      // Continue with response even if activity tracking fails
    }

    res.json({ explanation: cleanedExplanation });
  } catch (error) {
    console.error("Error getting node info:", error);
    res.status(500).json({ error: "Failed to get node information" });
  }
};

exports.getUserMindmaps = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const mindmaps = await Mindmap.find({
      walletAddress: walletAddress.toLowerCase(),
    })
      .select("topic createdAt")
      .sort("-createdAt");

    res.json(mindmaps);
  } catch (error) {
    console.error("Error fetching user mindmaps:", error);
    res.status(500).json({ error: "Failed to fetch mindmaps" });
  }
};

exports.getMindmapByTopic = async (req, res) => {
  try {
    const { walletAddress, topic } = req.params;
    const mindmap = await Mindmap.findOne({
      walletAddress: walletAddress.toLowerCase(),
      topic,
    });

    if (!mindmap) {
      return res.status(404).json({ error: "Mindmap not found" });
    }

    res.json(mindmap);
  } catch (error) {
    console.error("Error fetching mindmap:", error);
    res.status(500).json({ error: "Failed to fetch mindmap" });
  }
};

// Add this to your existing mindmapController
exports.trackNodeClick = async (req, res) => {
  try {
    const { walletAddress, topic, nodeText } = req.body;
    const clickedNode = new ClickedNode({
      walletAddress,
      topic,
      nodeText,
    });
    await clickedNode.save();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getClickedNodes = async (req, res) => {
  try {
    const { walletAddress, topic } = req.params;
    const clickedNodes = await ClickedNode.find({ walletAddress, topic });
    res.status(200).json(clickedNodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMindmap = async (req, res) => {
  try {
    const { walletAddress, topic } = req.params;

    // Delete the mindmap
    await Mindmap.findOneAndDelete({
      walletAddress: walletAddress.toLowerCase(),
      topic,
    });

    // Delete all related clicked nodes
    await ClickedNode.deleteMany({
      walletAddress: walletAddress.toLowerCase(),
      topic,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting mindmap:", error);
    res.status(500).json({ error: "Failed to delete mindmap" });
  }
};
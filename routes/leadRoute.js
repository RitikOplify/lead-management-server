const express = require("express");
const {
  createLead,
  getAllDetails,
  createFolloUp,
  getLeadDetails,
} = require("../controllers/leadController");
const { isAuthenticated, isAdmin } = require("../middlewares/auth");
const router = express.Router();

router.post("/create", isAuthenticated, isAdmin, createLead);
router.get("/alldetails", isAuthenticated, isAdmin, getAllDetails);
router.post("/create-followup", isAuthenticated, isAdmin, createFolloUp);
router.get("/:id", isAuthenticated, isAdmin, getLeadDetails);

module.exports = router;

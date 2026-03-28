import express from "express";
import searchService from "../services/search.service.js";
import authMiddleware from "../middleware/auth-middleware.js";
import asyncHandler from "../middleware/async-handler.js";

const router = express.Router();

/**
 * Unified Search Endpoint
 * GET /api-v1/search?q=query
 */
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(200).json([]);
    }

    const results = await searchService.unifiedSearch(q, req.user._id);
    res.status(200).json(results);
  })
);

export default router;

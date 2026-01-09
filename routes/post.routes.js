const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const {
  createPost,
  getPosts,
  addComment,
  deletePost,
  updatePost,
  getPostById, 
} = require("../controllers/post.controller");

router.get("/", getPosts);
router.post("/", auth, admin, createPost);
router.post("/:id/comment", auth, addComment);
router.delete("/:id", auth, admin, deletePost);


router.put("/:id", auth, admin, updatePost);

router.get("/:id", getPostById);

module.exports = router;

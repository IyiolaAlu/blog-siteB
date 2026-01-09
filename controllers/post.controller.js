const Post = require("../models/post.model");

exports.updatePost = async (req, res) => {
  try {
    const { title, content, image } = req.body;

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, image },
      { new: true } 
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json({ status: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const post = await Post.create({
      title: req.body.title,
      content: req.body.content,
      image: req.body.image,
      author: req.user._id,
    });

    res.status(201).json({ status: true, post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "firstName lastName")
      .populate("comments.user", "firstName lastName profilePicture")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    post.comments.push({
      user: req.user._id,
      comment: req.body.comment,
    });

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "firstName lastName profilePicture")
      .populate("comments.user", "firstName lastName profilePicture");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json({ post });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

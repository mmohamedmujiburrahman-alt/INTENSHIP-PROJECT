import fs from "fs";
import imagekit from "../configs/imagekit.js";
import User from "../models/User.js";
import Post from "../models/Post.js";


// Add POST
export const addPost = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { content, post_type } = req.body;
    const image = req.files;

    let image_urls = []

    if (image) {
      image_urls = await Promise.all(image.map(async (imgFile) => {
        const fileBuffer = fs.readFileSync(imgFile.path)
        const response = await imagekit.upload({
          file: fileBuffer,
          fileName: imgFile.originalname,
          folder: "posts",
        })
        const url = imagekit.url({
          path: response.filePath,
          transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '1280' }],
        })
        return url
      })
      )
    }
    await Post.create({
      user: userId,
      content,
      image_urls,
      post_type
    })
    res.json({ success: true, message: "Post created successfully" })
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// Get Posts
export const getFeedPosts = async (req, res) => {
  try {

    const userId = req.userId

    const user = await User.findById(userId)

    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      })
    }

    const userIds = [
      userId,
      ...(user.connections || []),
      ...(user.following || [])
    ]

    const posts = await Post.find({
      user: { $in: userIds }
    })
      .populate('user')
      .sort({ createdAt: -1 })

    return res.json({
      success: true,
      posts
    })

  } catch (error) {
    console.log(error)

    return res.json({
      success: false,
      message: error.message
    })
  }
}

// Like Post
export const LikePost = async (req, res) => {
  try {
    const { userId } = await req.auth()
    const { postId } = req.body;

    const post = await Post.findById(postId)

    if (post.likes_count.includes(userId)) {
      post.likes_count = post.likes_count.filter(user => user !== userId)
      await post.save()
      res.json({ success: true, message: 'Post unliked' })
    } else {
      post.likes_count.push(userId)
      await post.save()
      res.json({ success: true, message: 'Post liked' })
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

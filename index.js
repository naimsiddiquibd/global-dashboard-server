const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB (Make sure your MongoDB server is running)
mongoose.connect('mongodb+srv://globalDashboard:N4ZVsnLjiwaGrur8@cluster0.fphq6.mongodb.net/GlobalDashboard?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// CORS middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Define the Post model
const Post = mongoose.model('Post', {
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  publishedDate: {
    type: Date,
    default: Date.now,
  },
  image: {
    type: String,
  },
  views: {
    type: Number,
    default: 0,
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // You might have a separate User model for user authentication
    },
  ],
  comments: [
    {
      text: {
        type: String,
        required: true,
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Create a new blog post
app.post('/posts', upload.single('image'), async (req, res) => {
  try {
    const { title, content, author, tags } = req.body;
    const image = req.file ? req.file.filename : null;

    const post = new Post({ title, content, author, tags, image });
    await post.save();

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while creating the post.' });
  }
});

// Get all blog posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ publishedDate: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the posts.' });
  }
});

// Get a single blog post by ID
app.get('/posts/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the post.' });
  }
});

// Update a blog post by ID
app.put('/posts/:postId', upload.single('image'), async (req, res) => {
  try {
    const { title, content, author, tags } = req.body;
    const image = req.file ? req.file.filename : null;

    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { title, content, author, tags, image },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while updating the post.' });
  }
});

// Delete a blog post by ID
app.delete('/posts/:postId', async (req, res) => {
  try {
    const post = await Post.findByIdAndRemove(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while deleting the post.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

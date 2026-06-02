import express from 'express';
import { upload } from "../configs/multer.js";
import { addUserStory, getStories } from "../controllers/storyController.js";
import { protect } from "../middlewares/auth.js";


const stroyRouter = express.Router()

stroyRouter.post('/create', upload.single('media'),protect, addUserStory)
stroyRouter.get('/get', protect, getStories)

export default stroyRouter
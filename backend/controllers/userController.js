import { readFileSync } from 'fs'
import imagekit from "../configs/imagekit.js"
import User from "../models/User.js"
import Connection from "../models/Connection.js"
import Post from '../models/Post.js'
import { inngest } from '../inngest/index.js'
import { clerkClient } from "@clerk/express"

// Get user data using userId
export const getUserData = async (req, res) => {

    console.log("getUserData called")

    try {

        const userId = req.userId

        let user = await User.findById(userId)

        if (!user) {

            const clerkUser = await clerkClient.users.getUser(userId)

            user = await User.create({
                _id: userId,
                email: clerkUser.emailAddresses[0].emailAddress,
                full_name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
                username: clerkUser.username || clerkUser.emailAddresses[0].emailAddress.split('@')[0],
                profile_picture: clerkUser.imageUrl
            })
        }

        return res.json({ success: true, user })

    } catch (error) {
        console.error(error.message)
        return res.json({ success: false, message: error.message })
    }
}

// Update user data
export const UpdateUserData = async (req, res) => {
    try {
        const { userId } = await req.auth()
        let { username, bio, location, full_name } = req.body

        const tempUser = await User.findById(userId)

        if (tempUser.username !== username) {
            const user = await User.findOne({ username })
            if (user) {
                // do not change the username if it is already taken
                username = tempUser.username
            }
        }
        if (!username) username = tempUser.username

        const updateData = {
            username,
            bio,
            location,
            full_name,
        }

        const profile = req.files && req.files.profile && req.files.profile[0]
        const cover = req.files && req.files.cover && req.files.cover[0]

        if (profile) {
            const buffer = readFileSync(profile.path)
            const response = await imagekit.upload({
                file: buffer,
                fileName: profile.originalname,
            })
            const url = imagekit.url({
                path: response.filePath,
                transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '512' }],
            })
            updateData.profile_picture = url
        }

        if (cover) {
            const buffer = readFileSync(cover.path)
            const response = await imagekit.upload({
                file: buffer,
                fileName: cover.originalname,
            })
            const url = imagekit.url({
                path: response.filePath,
                transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '1280' }],
            })
            updateData.cover_photo = url
        }

        const user = await User.findByIdAndUpdate(userId, updateData, { new: true })

        res.json({ success: true, user, message: 'profile updated successfully' })

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message })

    }
}

// Find User using username, email, location, name

export const discoverUsers = async (req, res) => {
    try {
        const { userId } = await req.auth()
        const { input } = req.body

        const allUsers = await User.find(
            {
                $or: [
                    { username: new RegExp(input, 'i') },
                    { email: new RegExp(input, 'i') },
                    { full_name: new RegExp(input, 'i') },
                    { location: new RegExp(input, 'i') }

                ]
            }
        )
        const filteredUsers = allUsers.filter(user => user._id.toString() !== userId)

        res.json({ success: true, users: filteredUsers })

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message })

    }
}

// Follow User
export const followUser = async (req, res) => {
    try {
        const { userId } = await req.auth()
        const { id } = req.body

        const user = await User.findById(userId)

        if (user.following && user.following.map(String).includes(String(id))) {
            return res.json({ success: false, message: 'You are already following this user' })
        }

        user.following = user.following || []
        user.following.push(id)
        await user.save()

        const toUser = await User.findById(id)
        toUser.followers = toUser.followers || []
        toUser.followers.push(userId)
        await toUser.save()

        res.json({ success: true, message: 'Now you are following this user' })

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Unfollow User
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = await req.auth()
        const { id } = req.body

        const user = await User.findById(userId)
        user.following = (user.following || []).filter(f => f.toString() !== id)
        await user.save()

        const toUser = await User.findById(id)
        toUser.followers = (toUser.followers || []).filter(f => f.toString() !== userId)
        await toUser.save()

        res.json({ success: true, message: 'You are no longer following this user' })

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Send Connection Requset
export const sendConnectionRequest = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { id } = req.body

        // Check id user has sent more than 20 Connection requests in the last 24 hours
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const connectionRequest = await Connection.find({ from_user_id: userId, created_at: { $gt: last24Hours } })
        if (connectionRequest.length >= 20) {
            return res.json({ success: false, message: 'You have sent more than 20 connection requests in the last 24 hours' })
        }

        // Check if users are already connected
        const connection = await Connection.findOne({
            $or: [
                { from_user_id: userId, to_user_id: id },
                { from_user_id: id, to_user_id: userId },
            ],
        })

        if (!connection) {
            const newConnection = await Connection.create({
                from_user_id: userId,
                to_user_id: id,
            })

            await inngest.send({
                name: 'app/connection-request',
                data: { connectionId: newConnection._id }
            })

            return res.json({ success: true, message: 'Connection request sent successfully' })
        } else if (connection && connection.status === 'accepted') {
            return res.json({ success: false, message: 'You are already connected with this user' })
        }
        return res.json({ success: false, message: 'Connection request pending' })

    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Get User Connections
export const getUserConnections = async (req, res) => {

    try {
        const { userId } = await req.auth()
        const user = await User.findById(userId).populate('connections followers following')

        const connections = user.connections || []
        const followers = user.followers || []
        const following = user.following || []

        const pendingConnections = (
            await Connection.find({ to_user_id: userId, status: 'pending' }).populate('from_user_id')
        ).map(connection => connection.from_user_id)

        res.json({ success: true, connections, followers, following, pendingConnections })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message })
    }
}

// Accept Connection Request
export const acceptConnectionRequest = async (req, res) => {
    try {
        const { userId } = await req.auth()
        const { id } = req.body;

        const connection = await Connection.findOne({ from_user_id: id, to_user_id: userId })

        if (!connection) {
            return res.json({ success: false, message: 'Connection request not found' });
        }

        const user = await User.findById(userId);
        user.connections.push(id);
        await user.save();

        const toUser = await User.findById(id);
        toUser.connections.push(userId);
        await toUser.save();

        connection.status = 'accepted';
        await connection.save();

        res.json({ success: true, message: 'Connection accepted successfully' });


    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}

// Get User Profiles
export const getUserProfile = async (req, res) => {
    try {
        const { profileId } = req.body;
        const profile = await User.findById(profileId)
        if (!profile) {
            return res.json({ success: false, message: "Profile not found" })
        }
        const posts = await Post.find({ user: profileId }).populate('user')

        res.json({ success: true, profile, posts })
    } catch (error) {
        console.error(error.message);
        res.json({ success: false, message: error.message });
    }
}
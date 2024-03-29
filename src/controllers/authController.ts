import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { PostLoginRequest } from '../schemas/users/postLoginSchemas.js';
import { PostSignupRequest } from '../schemas/users/postSignupSchemas.js';
import { GetUserProfileRequest } from '../schemas/users/getUserProfileSchemas.js';
import asyncHandler from 'express-async-handler';

export const PostLoginUser = asyncHandler(_PostLoginUser);
async function _PostLoginUser(req: PostLoginRequest, res: Response) {
    const { email, password, fcmToken } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            res.status(401).json({ error: "Email/password is invalid." });
            return;
        }

        const passwordMatch = await bcrypt.compare(password, existingUser.password);

        if (!passwordMatch) {
            res.status(401).json({ error: "Email/password is invalid." });
            return;
        }

        // Update the FCM token if it has changed since last time.
        if (fcmToken && fcmToken.length > 2) {
            if (existingUser.fcmToken !== fcmToken) {
                existingUser.fcmToken = fcmToken;
                await existingUser.save();
            }
        }

        const token = jwt.sign({ userId: existingUser._id }, 'theKyduKey', { expiresIn: '30d' });

        console.log(`[${new Date().toLocaleTimeString().toUpperCase()}] ✨ [/login] '${email}' has been granted a login token.`)

        res.status(200).json({ token, userId: existingUser._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
}

export const PostSignupUser = asyncHandler(_PostSignupUser);
async function _PostSignupUser(req: PostSignupRequest, res: Response) {
    const { name, email, password, fcmToken } = req.body;

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            res.status(400).json({ error: "Email/password is invalid." });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            fcmToken,
            password: hashedPassword,
        });

        await newUser.save();

        console.log(`[${new Date().toLocaleTimeString().toUpperCase()}] ✨ [/signup] ${name} has registered an account under the address '${email}'.`)

        res.status(201).json({ message: "User created successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
}

export const GetUserProfile = asyncHandler(_GetUserProfile);
async function _GetUserProfile(req: GetUserProfileRequest, res: Response) {
    const userId = req.user.userId;
    const { alertsOnly } = req.query;

    try {
        if (alertsOnly) {
            const alerts = await User.findById(userId).select("alerts");
            if (!alerts) {
                res.status(404).send({ error: "User not found."});
                return;
            }
            res.status(200).send(alerts);
        } else {
            const user = await User.findById(userId).select('-password -alerts');
            if (!user) {
                res.status(404).send({ error: "User not found."});
                return;
            }
            res.status(200).send(user);
        }


    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An unknown error has occured." });
    }
}
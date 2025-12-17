import { verifyToken, createClerkClient } from '@clerk/backend';
import User from '../models/User.js';

// Lazy initialization to handle ESM hoisting
let clerkClientInstance;
const getClerkClient = () => {
    if (!clerkClientInstance) {
        clerkClientInstance = createClerkClient({
            secretKey: process.env.CLERK_SECRET_KEY,
        });
    }
    return clerkClientInstance;
};

/**
 * Authentication Middleware using Clerk
 * Verifies JWT session token using verifyToken from @clerk/backend (networkless verification)
 */
export const requireAuth = async (req, res, next) => {
    try {
        // Get the session token from the Authorization header
        const authHeader = req.headers.authorization;


        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please sign in.',
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify the JWT token using Clerk's verifyToken (networkless)
        try {
            const verifiedToken = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });


            if (!verifiedToken || !verifiedToken.sub) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired session.',
                });
            }

            const clerkUserId = verifiedToken.sub;

            // Find user in our database first (Performance optimization & resilience)
            let user = await User.findOne({ clerkUserId });

            if (!user) {
                // Only call Clerk API if user doesn't exist locally
                const clerkUser = await getClerkClient().users.getUser(clerkUserId);

                // Create new user if they don't exist
                user = await User.create({
                    clerkUserId: clerkUser.id,
                    email: clerkUser.emailAddresses[0]?.emailAddress || '',
                    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Anonymous User',
                    avatar: clerkUser.imageUrl || '',
                });
            }

            // Attach user info to request
            req.auth = {
                userId: clerkUserId,
                sessionId: verifiedToken.sid,
            };
            req.user = user;


            next();
        } catch (clerkError) {
            console.error('Clerk verification error:', clerkError);
            return res.status(401).json({
                success: false,
                message: 'Authentication failed. Please sign in again.',
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error',
        });
    }
};

/**
 * Optional Auth Middleware
 * Attaches user info if authenticated, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.auth = null;
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];

        try {
            const verifiedToken = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });

            if (verifiedToken && verifiedToken.sub) {
                const clerkUserId = verifiedToken.sub;
                let user = await User.findOne({ clerkUserId });

                if (!user) {
                    const clerkUser = await getClerkClient().users.getUser(clerkUserId);
                    user = await User.create({
                        clerkUserId: clerkUser.id,
                        email: clerkUser.emailAddresses[0]?.emailAddress || '',
                        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Anonymous User',
                        avatar: clerkUser.imageUrl || '',
                    });
                }

                req.auth = {
                    userId: clerkUserId,
                    sessionId: verifiedToken.sid,
                };
                req.user = user;
            } else {
                req.auth = null;
                req.user = null;
            }
        } catch {
            // Silently continue without auth
            req.auth = null;
            req.user = null;
        }

        next();
    } catch (error) {
        req.auth = null;
        req.user = null;
        next();
    }
};

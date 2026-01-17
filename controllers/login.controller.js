import { User } from "../models/models.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// Helper to determine production environment
const isProduction = process.env.NODE_ENV === "production";

const get_github_user = async function(access_token) {
    const userResponse = await fetch("https://api.github.com/user", {
        headers: {
            "Authorization": `Bearer ${access_token}`,
            "Accept": "application/vnd.github+json"
        }
    });
    return await userResponse.json();
}

const get_github_token = async function(code) {
    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;

    const params = new URLSearchParams();
    params.append("client_id", client_id);
    params.append("client_secret", client_secret);
    params.append("code", code);
    
    // IMPORTANT: This redirect_uri must match EXACTLY what you set in GitHub OAuth settings
    params.append("redirect_uri", `${process.env.API_URL}/api/auth/login`);

    const token = fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
    }).then(async (res) => {
        const data = await res.json();
        return data.access_token;
    }).catch((err) => {
        console.log(`log cannot get token from github `, err);
        return null;
    })
    return token;
}

const create_jwt_token = async (_id) => {
    const token = jwt.sign({
        _id: _id,
    }, process.env.JWT_SECRET, { expiresIn: '1h' })

    return token;
}

// --- Login Controller ---
const login_controller = asyncHandler(async (req, res) => {
    const { code } = req.query;
    const frontendURL = process.env.FRONTEND_URL;

    // Fail safe redirection
    const failRedirect = `${frontendURL}/login?success=false`;

    if (!code) return res.redirect(failRedirect);

    // Get GitHub access token
    const token = await get_github_token(code);
    if (!token) return res.redirect(failRedirect);

    // Get GitHub user
    const user_github = await get_github_user(token);
    if (!user_github || !user_github.login) {
        console.log("cannot get user");
        return res.redirect(failRedirect);
    }

    // Check if user exists in DB or create new
    let user = await User.findOne({ githubId: user_github.login });
    if (!user) {
        user = await User.create({
            githubId: user_github.login,
            username: user_github.name || user_github.login
        });
    }

    // Create JWT
    const jwt_token = await create_jwt_token(user._id);

    // Set Cookie with production settings
    res.cookie("access_token", jwt_token, {
        httpOnly: true,
        secure: isProduction, // True in production (HTTPS)
        sameSite: isProduction ? "none" : "lax", // 'none' needed for cross-site cookies in prod
        maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    });

    return res.redirect(frontendURL);
});

// --- Check Login Controller ---
const check_login_controller = asyncHandler(async (req, res) => {
    const token = req?.cookies?.access_token;

    if (!token) {
        return res.json({
            login: false,
            isSuperAdmin: false,
            message: "no token present"
        });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.json({
            login: false,
            isSuperAdmin: false,
            message: "wrong access token"
        });
    }

    const user = await User.findById(payload._id).select("globalRole");

    if (!user) {
        return res.json({
            login: false,
            isSuperAdmin: false,
            message: "user not found"
        });
    }

    const isSuperAdmin = user.globalRole === "super_admin";

    return res.json({
        login: true,
        isSuperAdmin,
        user_id: user._id,
        message: "user logged in successfully"
    });
});

// --- Logout Controller ---
const logout_controller = asyncHandler(async (req, res) => {
    
    // Options must match the login cookie exactly to clear it successfully
    res.clearCookie("access_token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax"
    });

    return res.status(200).json({
        login: false,
        isSuperAdmin: false,
        message: "Logged out successfully"
    });
});

export { login_controller, check_login_controller, logout_controller };
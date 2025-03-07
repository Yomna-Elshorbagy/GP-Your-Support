import passport from "passport";
import Token from "../../../database/models/token.model.js";
import User from "../../../database/models/user.model.js";
import { verifyGoogleToken } from "../../utils/oAuth/google-strategy.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Utility function to verify tokens based on provider //using OAuth2Client
const verifyTokenId = async (provider, token) => {
  switch (provider) {
    case "GOOGLE":
      return await verifyGoogleToken(token);

    case "FACEBOOK":
      // Verify token with Facebook's API
      const fbResponse = await fetch(
        `https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,picture`
      );
      if (!fbResponse.ok) throw new Error("Invalid Facebook token");
      return await fbResponse.json();

    case "GITHUB":
      // Verify token with GitHub's API
      const ghResponse = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!ghResponse.ok) throw new Error("Invalid GitHub token");
      return await ghResponse.json();

    default:
      throw new Error("Unknown provider");
  }
};

export const signupWithOAuth = async (req, res, next) => {
  const provider = req.headers["provider"]; // expecting GOOGLE, FACEBOOK, or GITHUB
  const token = req.headers["id-token"]; // token can be an idToken or accessToken depending on provider
  const accessToken = req.headers["Authorization"]?.split(" ")[1]; // Google Access Token

  try {
    // Step 1: Verify Token
    const userData = await verifyTokenId(provider, token);

    // Step 2: Check for required fields (Example: email verification for Google)
    if (provider === "GOOGLE" && userData.email_verified !== true) {
      return res
        .status(400)
        .json({ error: "Email not verified. Use a verified Google account." });
    }

    let profileData;
    if (provider === "GOOGLE" && accessToken) {
      profileData = await getGoogleUserProfile(accessToken);
    }
    const userEmail = userData.email;
    const userName =
      userData?.name ||
      profileData?.names?.[0]?.displayName ||
      userData.email.split("@")[0];

    // Step 3: Check if user already exists in database
    const existingUser = await User.findOne({
      email: userData.email,
      provider,
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User already exists. Please log in instead." });
    }

    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Step 4: Create a new user
    const newUser = new User({
      email: userEmail,
      userName,
      password: hashedPassword,
      address: "No Data",
      otpCode: null,
      otpExpire: null,
      isVerified: true,
      isActive: true,
      provider,
    });

    // Step 5: Save the new user to the database
    await newUser.save();

    // Respond with signup success and user data
    res.status(201).json({
      message: "Signup successful",
      userData: { ...userData, newUser },
    });
  } catch (error) {
    res.status(401).json({ error: error.message || "Invalid token" });
  }
};

export const loginWithOAuth = async (req, res, next) => {
  const provider = req.headers["provider"]; // Expecting GOOGLE, FACEBOOK, or GITHUB
  const idtoken = req.headers["id-token"]; // Token can be an idToken or accessToken depending on provider

  try {
    // Step 1: Verify Token
    const userData = await verifyTokenId(provider, idtoken);

    // Step 2: check for required fields
    if (provider === "GOOGLE" && userData.email_verified !== true) {
      return res
        .status(400)
        .json({ error: "Email not verified. Use a verified Google account." });
    }

    //check data by email
    const user = await User.findOne({
      email: userData.email,
      // provider: "GOOGLE",
    });
    if (!user) return next(new Error("User Not found", { cause: 404 }));

    //generate token
    const token = jwt.sign(
      { userId: user._id, email: userData.email, role: user.role },
      "secret",
      { expiresIn: "30d" }
    );

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await Token.create({
      token: token,
      userId: user._id,
      expiresAt,
      isValid: true,
    });
    res.status(200).json({
      message: "login successfully with google",
      userData,
      token: token,
    });
  } catch (error) {
    console.error("Token verification failed:", error);

    res.status(401).json({ error: "Invalid token" });
  }
};



//using passport
export const googleAuth = passport.authenticate("google", {
    scope: ["profile", "email"],
  });
  
  export const googleAuthCallback = passport.authenticate("google", {
    failureRedirect: "/login",
  });
  
  export const googleAuthSuccess = (req, res) => {
    if (!req.user) {
      return res.redirect("/login");
    }
    res.redirect("/user/profile");
  };
  
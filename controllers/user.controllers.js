const UserModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // Use 587 for TLS
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 30000, // 30 seconds timeout
  // Add TLS options
  tls: {
    ciphers: "SSLv3",
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Mail transporter error:", error);
  } else {
    console.log("Mail server ready");
  }
});

const signUp = async (req, res) => {
  const { firstName, lastName, email, password, profilePicture } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imageUrl = "";

    if (profilePicture) {
      const uploadResult = await cloudinary.uploader.upload(profilePicture, {
        resource_type: "image",
      });
      imageUrl = uploadResult.secure_url;
    }

    const user = await UserModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profilePicture: imageUrl,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      status: true,
      message: "user created successfully",
      user: {
        id: user._id,
        fullname: user.firstName + " " + user.lastName,
        email: user.email,
        profilePicture: user.profilePicture,
      },
      token,
    });

    try {
      await transporter.sendMail({
        from: `"DevJourney" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject: "Welcome to DevJourney 🚀",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Welcome to DevJourney</title>
</head>
<body style="margin:0; padding:0; background:#f4f6f8; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.08);">
          
          <tr>
            <td style="background:#0d6efd; padding:30px; text-align:center;">
              <h1 style="color:#ffffff; margin:0;">DevJourney 🚀</h1>
              <p style="color:#e8f0ff; margin:8px 0 0;">Learn • Build • Grow</p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 30px; color:#333333;">
              <h2>Welcome, ${user.firstName} 👋</h2>

              <p style="font-size:16px; line-height:1.6;">
                Thanks for joining <strong>DevJourney</strong>.
                This is where I share real-world experiences,
                projects, and lessons from my web development journey.
              </p>

              <ul style="font-size:16px; line-height:1.8; padding-left:20px;">
                <li>📘 React, Node.js & JavaScript tutorials</li>
                <li>🛠 Practical projects and tips</li>
                <li>🚀 Growth-focused developer content</li>
              </ul>

              <p>
                Happy coding 👨‍💻✨<br/>
                <strong>— Alu Iyiola</strong>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f1f3f5; padding:20px; text-align:center; font-size:14px; color:#777;">
              © 2026 DevJourney · Built with passion 💙
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `,
      });
    } catch (mailError) {
      console.error("Email failed:", mailError);
    }
  } catch (error) {
    console.log(error);

    if (error.code === 11000) {
      res.status(400).json({
        status: false,
        message: "user already exists",
      });
    } else {
      res.status(500).json({
        status: false,
        message: "user cannot be created at this time",
      });
    }
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      res.status(404).json({
        status: false,
        message: "Invalid credentials!",
      });
    } else {
      let isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(404).json({
          status: false,
          message: "Invalid credentials",
        });
      } else {
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });
        res.status(200).json({
          status: true,
          message: "user can login",
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullname: user.firstName + " " + user.lastName,
            email: user.email,
            profilePicture: user.profilePicture,
            isAdmin: user.isAdmin,
          },
          token,
        });
      }
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: false,
      message: "Invalid credentials",
    });
  }
};

const verify = async (req, res, next) => {
  try {
    const token =
      req.headers["authorization"]?.split(" ")[1] ||
      req.headers["authorization"]?.split(" ")[0];

    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
      if (err) {
        res.send({
          status: false,
          message: "User Unauthorized!",
        });
      } else {
        req.userId = decoded.id;
        next();
      }
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: "User Unauthorized!",
    });
  }
};

const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    let user = await UserModel.findById(id);
    if (user) {
      res.send({
        status: true,
        user,
      });
    }
  } catch (error) {
    console.log(error);
    res.send({
      status: false,
      message: "user fetch failed",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, profilePicture } = req.body;

    let updatedData = { firstName, lastName };

    if (profilePicture) {
      const image = await cloudinary.uploader.upload(profilePicture, {
        resource_type: "image",
      });
      updatedData.profilePicture = image.secure_url;
    }

    const user = await UserModel.findByIdAndUpdate(req.userId, updatedData, {
      new: true,
    });

    res.status(200).json({
      status: true,
      user: {
        id: user._id,
        fullname: user.firstName + " " + user.lastName,
        email: user.email,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: false });
  }
};

module.exports = {
  signUp,
  login,
  verify,
  getUser,
  updateProfile,
};

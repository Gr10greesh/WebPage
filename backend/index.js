const dotenv = require('dotenv');
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Initialize app and config
dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// Database Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://greeshdahal432:gr10greesh@cluster0.f0zi3.mongodb.net/gr10")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  phonenumber: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true }
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 1 }
  }]
}, { timestamps: true });

// Models
const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Cart = mongoose.model("Cart", cartSchema);

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Image Upload Configuration
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });
app.use("/images", express.static("upload/images"));

// Utility Functions
const generateAuthToken = (userId) => {
  return jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET || "secret_ecom", { expiresIn: "1h" });
};

// Routes
app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: 0, message: "No file uploaded" });
  }
  res.json({
    success: 1,
    image_url: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });
});

// Auth Routes
app.post("/signup", async (req, res) => {
  try {
    const { phonenumber, email, password } = req.body;
    
    if (!phonenumber || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const [emailCheck, phoneCheck] = await Promise.all([
      User.findOne({ email }),
      User.findOne({ phonenumber })
    ]);

    if (emailCheck) return res.status(400).json({ success: false, message: "Email already exists" });
    if (phoneCheck) return res.status(400).json({ success: false, message: "Phone number already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ phonenumber, email, password: hashedPassword });

    res.json({ 
      success: true, 
      token: generateAuthToken(newUser.id) 
    });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    res.json({ 
      success: true, 
      token: generateAuthToken(user.id) 
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Password Reset Routes
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ success: true, message: "If this email exists, a reset link will be sent" });;
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `http://localhost:3000/login?token=${resetToken}`;

    const mailOptions = {
      from: `"Nodemailer" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested a password reset for your account.</p>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">Copy this token to reset your password:</p>
        <div style="background: white; padding: 10px; border: 1px solid #ddd; border-radius: 3px; word-break: break-all;">
          ${resetToken}
        </div>
      </div>
      
      <p>Or click the button below to reset automatically:</p>
      <a href="http://localhost:3000/login?token=${resetToken}" 
         target="_self"
         style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">
         Reset Password
      </a>
      
      <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
        This token will expire in 1 hour. If you didn't request this, please ignore this email.
      </p>
    </div>`
};

    await transporter.sendMail(mailOptions);
    console.log(`Reset email sent to ${email}`); // Add this log
    res.json({ success: true, message: "Reset link sent to your email" });
  } catch (error) {
    console.error("Email sending error:", error); // Detailed error logging
    res.status(500).json({ success: false, message: "Failed to send reset email" });
  }
});

app.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Product Routes
app.post("/addproduct", async (req, res) => {
  try {
    const maxIdProduct = await Product.findOne().sort({ id: -1 });
    const newId = maxIdProduct ? maxIdProduct.id + 1 : 1;

    const product = await Product.create({
      id: newId,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
    });

    res.json({ success: true, product });
  } catch (err) {
    console.error("Add Product Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/allproducts", async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    console.error("Get Products Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/product/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (err) {
    console.error("Get Product Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/removeproduct", async (req, res) => {
  try {
    const { id } = req.body;
    await Product.findOneAndDelete({ id });
    res.json({ success: true, message: "Product removed" });
  } catch (err) {
    console.error("Remove Product Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get('/category/:category', async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category.toLowerCase() });
    res.json(products.length ? products : { message: `No products in ${req.params.category} category` });
  } catch (err) {
    console.error("Category Products Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/api/products/search", async (req, res) => {
  try {
    const { q } = req.query;
    
    // If search query is empty, return all products
    if (!q || q.trim() === '') {
      const allProducts = await Product.find({});
      return res.json(allProducts);
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    });

    res.json(products);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Failed to search products" });
  }
})

// Cart Routes
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("auth-token");
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_ecom");
    req.userId = decoded.user.id;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

app.post("/update-cart", authenticate, async (req, res) => {
  try {
    const items = Object.entries(req.body.cartItems).map(([productId, quantity]) => ({
      productId,
      quantity
    }));

    const cart = await Cart.findOneAndUpdate(
      { userId: req.userId },
      { $set: { items } },
      { new: true, upsert: true }
    ).populate("items.productId");

    res.json({ success: true, cart });
  } catch (err) {
    console.error("Update Cart Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/cart", authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId }).populate("items.productId");
    res.json({ success: true, items: cart?.items || [] });
  } catch (err) {
    console.error("Get Cart Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/clear-cart", authenticate, async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.userId },
      { $set: { items: [] } }
    );
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("Clear Cart Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
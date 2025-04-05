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
const fs = require('fs');

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

// Enhanced User Schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  phonenumber: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  avatar: { type: String, default: '' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerified: { type: Boolean, default: false },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  kyc: {
    documentType: { type: String, default: '' },
    documentNumber: { type: String, default: '' },
    issuedDate: { type: Date, default: null },
    verified: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Product Schema
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

// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 1 }
  }]
}, { timestamps: true });

// Enhanced Order Schema
const orderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  }],
  status: { 
    type: String,
    enum: ['processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  total: {
    type: Number,
    required: true
  },
  shippingAddress: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Models
const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Order = mongoose.model("Order", orderSchema);

// Authentication Middleware
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


const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

app.use("/images", express.static("upload/images"));

// Utility Functions
const generateAuthToken = (userId) => {
  return jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET || "secret_ecom", { expiresIn: "1h" });
};

// ==================== ROUTES ====================

// User Profile Routes
app.get('/api/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password -resetPasswordToken')
      .populate('referrals', 'firstName lastName email');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/api/user/profile', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phonenumber: req.body.phone
    };

    if (req.file) {
      // Delete old avatar if exists
      const user = await User.findById(req.userId);
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, 'upload', 'images', path.basename(user.avatar));
        fs.unlink(oldAvatarPath, (err) => {
          if (err) console.error('Error deleting old avatar:', err);
        });
      }
      updates.avatar = `/images/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// KYC Routes
app.put('/api/user/kyc', authenticate, upload.single('document'), async (req, res) => {
  try {
    const { documentType, documentNumber, issuedDate } = req.body;
    
    const kycData = {
      documentType,
      documentNumber,
      issuedDate: new Date(issuedDate),
      verified: false
    };

    if (req.file) {
      kycData.documentImage = `/images/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { kyc: kycData },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'KYC update failed' });
  }
});

// Order Routes
app.get('/api/user/orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedOrders = orders.map(order => ({
      ...order,
      createdAt: new Date(order.createdAt).toLocaleDateString(),
      items: order.items.map(item => ({
        ...item,
        product: {
          name: item.name,
          image: item.productId?.image || '',
          price: item.price
        }
      }))
    }));

    res.json(formattedOrders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Referral Routes
app.get('/api/user/referrals', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('referrals', 'firstName lastName email createdAt')
      .select('referrals');
    
    res.json(user.referrals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// Auth Routes
app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, phonenumber, email, password, referralCode } = req.body;
    
    // Validation
    if (!firstName || !email || !password) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    // Check existing user
    const [emailCheck, phoneCheck] = await Promise.all([
      User.findOne({ email }),
      phonenumber ? User.findOne({ phonenumber }) : Promise.resolve(null)
    ]);

    if (emailCheck) return res.status(400).json({ success: false, message: "Email exists" });
    if (phoneCheck) return res.status(400).json({ success: false, message: "Phone exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      phonenumber,
      email,
      password: hashedPassword
    });

    // Handle referral if exists
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) {
        referrer.referrals.push(newUser._id);
        await referrer.save();
      }
    }

    res.json({ 
      success: true, 
      token: generateAuthToken(newUser._id),
      userId: newUser._id
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
      return res.status(400).json({ success: false, message: "Credentials required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    res.json({ 
      success: true, 
      token: generateAuthToken(user._id),
      userId: user._id
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
});

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
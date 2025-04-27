const dotenv = require('dotenv');
const express = require("express");
const session = require('express-session');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const mongoose = require("mongoose");
const MongoStore = require('connect-mongo');
const multer = require("multer");
const path = require("path");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const fs = require('fs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Initialize app and config
dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use("/images", express.static(path.join(__dirname, "upload/images")));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    sameSite: 'lax', // Helps with OAuth flows
    maxAge: 24 * 60 * 60 * 1000
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60
  })
}));

app.use((req, res, next) => {
  console.log('Session data:', req.session); // Debug session
  next();
});


// Database Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://greeshdahal432:gr10greesh@cluster0.f0zi3.mongodb.net/gr10")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Enhanced User Schema
const userSchema = new mongoose.Schema({
  phonenumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  emailVerified: { type: Boolean, default: false },
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
  available: { type: Boolean, default: true },
  reviews: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    comment: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
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
    enum: ['processing', 'delivered', 'cancelled'],
    default: 'processing'
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  isArchived: {   
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Subscriber Schema
const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Models
const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Order = mongoose.model("Order", orderSchema);
const Subscriber = mongoose.model("Subscriber", subscriberSchema);



// Authentication Middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("auth-token");
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_ecom");
    req.userId = decoded.user.id;
    req.user = decoded.user;
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

//app.use("/images", express.static("upload/images"));

// Configure Passport for Google OAuth
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:4000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google profile:', profile); // Debug log
    
    // Check if user exists by Google email
    let user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      console.log('Existing user found:', user); // Debug log
      return done(null, user);
    }

    // Create new user with better placeholder data
    user = new User({
      email: profile.emails[0].value,
      phonenumber: `google-${profile.id}`, // Better placeholder format
      emailVerified: true,
      password: null
    });

    await user.save();
    console.log('New user created:', user); // Debug log
    
    return done(null, user);
  } catch (err) {
    console.error('Google auth error:', err);
    return done(err, null);
  }
}));

passport.use('google-verify-email', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: 'http://localhost:4000/auth/google/verify-email/callback',
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Just return the email for verification
    return done(null, { 
      email: profile.emails[0].value,
      // Include any other needed profile info
      name: profile.displayName 
    });
  } catch (err) {
    return done(err, null);
  }
}));


// Serialize and deserialize user for session
passport.serializeUser((user, done) => {
  if (user._id) {
    // Regular user case (has MongoDB _id)
    done(null, { id: user._id, type: 'user' });
  } else {
    // Email verification case (just has email)
    done(null, { email: user.email, type: 'email' });
  }
});

passport.deserializeUser(async (obj, done) => {
  try {
    if (obj.type === 'user') {
      const user = await User.findById(obj.id);
      done(null, user);
    } else {
      // For email verification, just pass through the email
      done(null, { email: obj.email });
    }
  } catch (err) {
    done(err, null);
  }
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Utility Functions
const generateAuthToken = (userId) => {
  return jwt.sign({ user: { id: userId } }, process.env.JWT_SECRET || "secret_ecom", { expiresIn: "1h" });
};

// ==================== ROUTES ====================

// User Profile Routes
app.get('/api/user', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-__v -resetPasswordToken -resetPasswordExpires')
      .lean();

    // Explicitly include password: null if it's null
    const responseData = {
      _id: user._id,
      email: user.email,
      phonenumber: user.phonenumber,
      password: user.password || null, // Explicit null
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json(responseData);
  } catch (err) {
    console.error("User fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create a POST route for file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const imagePath = `/images/${req.file.filename}`;
  res.json({ success: true, image_url: imagePath });
});

//const KHALTI_API_BASE = 'https://a.khalti.com/api/v2/epayment';
const KHALTI_API_BASE = 'https://dev.khalti.com/api/v2/';

// Initiate Payment
app.post('/api/payment/initiate', authenticate, async (req, res) => {
  try {
    const { amount, purchase_order_id, purchase_order_name, return_url } = req.body;

    // Validate the request body
    if (!amount || !purchase_order_id || !purchase_order_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const payload = {
      return_url: return_url || 'http://localhost:3000/payment-callback',
      website_url: 'http://localhost:3000',
      amount: amount * 100, // Convert to paisa
      purchase_order_id,
      purchase_order_name,
    };

    const response = await axios.post(
      `${KHALTI_API_BASE}/epayment/initiate/`,
      payload,
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: response.data
    });
  } catch (err) {
    console.error('Payment initiation error:', err.response?.data || err.message);
    res.status(400).json({
      success: false,
      message: err.response?.data?.detail || 'Payment initiation failed'
    });
  }
});



// Payment Routes
app.get('/api/payment/verify', authenticate, async (req, res) => {
  try {
    const { pidx } = req.query;

    if (!pidx) {
      return res.status(400).json({
        success: false,
        message: 'PIDX is required'
      });
    }

    const response = await axios.post(
      `${KHALTI_API_BASE}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    res.json({
      success: true,
      payment: {
        method: 'Khalti',
        amount: response.data.amount / 100,
        transactionId: response.data.idx,
        verifiedAt: new Date()
      }
    });
  } catch (err) {
    console.error('Verification error:', err.response?.data || err.message);
    res.status(400).json({
      success: false,
      message: err.response?.data?.detail || 'Payment verification failed'
    });
  }
});


// Order Routes
app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const order = await Order.create({
      userId: req.userId,
      ...req.body
    });
    
    res.json({ success: true, order });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Order Routes
app.get('/api/user/orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name image price'); // optional: load product details
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});


// Update the password change route
app.put('/api/user/profile', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword, isGoogleUser } = req.body;
    const user = await User.findById(req.userId);

    console.log('Password update request:', { 
      isGoogleUser, 
      hasPassword: user.password !== null,
      currentPasswordLength: currentPassword?.length 
    });

    // For Google users or users without password
    if (isGoogleUser || user.password === null) {
      // Skip current password verification
      console.log('Skipping current password verification for Google user');
    } 
    else {
      // Regular users must provide current password
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }

    // Validate new passwords
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    res.status(500).json({ message: 'Failed to update password', error: err.message });
  }
});


app.put("/api/user/number",authenticate,async(req,res)=>{
  try{
    const { phonenumber } = req.body;
    console.log("request",req.body);
    console.log(req.userId);
    const user = await User.findById(req.userId);
    if(!user) {

      res.status(400).json({ message: 'Failed to update Phone Number' });

    }

    user.phonenumber = phonenumber;
    await user.save();

    res.status(200).json({ message: 'Phone Number Updated Successfully' });

  }
  catch(error) {
    res.status(500).json({ message: 'Failed to update Phone Number' });
    console.log(error)

  }
})

// Admin updates order status
app.put('/api/admin/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin archives an order
app.put('/api/admin/orders/:orderId/archive', async (req, res) => {
  try {
    const { orderId } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { isArchived: true },
      { new: true }
    );
    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('Error archiving order:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});




// Google OAuth Routes
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/verify-email', passport.authenticate('google-verify-email', {
  scope: ['profile', 'email'],
  session: true
}));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  // Successful authentication
  const token = jwt.sign(
    { user: { id: req.user._id } },
    process.env.JWT_SECRET || "secret_ecom",
    { expiresIn: "1h" }
  );
  // Redirect to frontend with token and userId
  res.redirect(`http://localhost:3000/login?token=${token}&userId=${req.user._id}`);
});

app.get('/auth/google/verify-email/callback', 
  passport.authenticate('google-verify-email', { 
    failureRedirect: 'http://localhost:3000/login?error=verification_failed'
  }),
  (req, res) => {
    // Store verified email in session
    req.session.verifiedEmail = req.user.email;
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('http://localhost:3000/login?error=session_error');
      }
      
      // Redirect back to frontend with success flag
      res.redirect('http://localhost:3000/signup?verified=true');
    });
  }
);

// Auth Routes
app.post("/signup", async (req, res) => {
  try {
    const { phonenumber, email, password } = req.body;

    // Validate input
    if (!phonenumber || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

          // Validate phone number format
    if (!/^\d{10}$/.test(phonenumber)) {
      return res.status(400).json({ 
        success: false, 
        message: "Phone number must be exactly 10 digits" 
      });
    }

    // Check session for verified email
    if (!req.session.verifiedEmail || req.session.verifiedEmail !== email) {
      return res.status(403).json({
        success: false,
        message: "Email verification required",
        needsVerification: true
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phonenumber }] 
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email 
          ? "Email already exists" 
          : "Phone number already exists"
      });
    }

    // Create and save new user
    const newUser = new User({
      phonenumber,
      email,
      password: await bcrypt.hash(password, 10),
      emailVerified: true
    });

    await newUser.save();

    // Clear verification flag
    delete req.session.verifiedEmail;
    await req.session.save();

    // Generate token
    const token = generateAuthToken(newUser._id);

    return res.json({
      success: true,
      token,
      userId: newUser._id
    });

  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Registration failed",
      error: err.message 
    });
  }
});

app.post('/check-email-verified', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ needsVerification: true });
  }

  if (req.session.verifiedEmail === email) {
    return res.json({ needsVerification: false });
  }

  return res.json({ needsVerification: true });
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
      from: `"Gr10" <${process.env.EMAIL_USER}>`,
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

// Admin fetches all non-archived orders
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find({ isArchived: false })
      .populate('userId', 'email phonenumber')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Server error' });
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



app.post("/product/:id/review", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const { name, comment, rating } = req.body;
    const newReview = {
      name: name.trim(),
      comment: comment.trim(),
      rating: parseInt(rating),
      createdAt: new Date()
    };

    product.reviews.push(newReview);
    await product.save();

    res.status(201).json({ success: true, review: newReview });
  } catch (error) {
    console.error("Error submitting review:", error);
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
    const items = Object.entries(req.body.cartItems).map(([productId, quantity]) => {
      // Validate that productId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(`Invalid productId: ${productId}`);
      }
      return {
        productId,
        quantity: parseInt(quantity)
      };
    });

    const cart = await Cart.findOneAndUpdate(
      { userId: req.userId },
      { $set: { items } },
      { new: true, upsert: true }
    ).populate("items.productId");

    res.json({ success: true, cart });
  } catch (err) {
    console.error("Update Cart Error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
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

// Subscription Route
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    // Check if email is already subscribed
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ success: false, message: "Email already subscribed" });
    }

    // Create new subscriber
    const subscriber = new Subscriber({ email });
    await subscriber.save();

    // Send confirmation email (using existing transporter)
    const mailOptions = {
      from: `"Top-Up Newsletter" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Top-Up Newsletter",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank You for Subscribing!</h2>
          <p>Welcome to the Top-Up community! You'll now receive updates on our latest offers and products.</p>
          <p style="color: #666; font-size: 0.9em;">
            If you did not subscribe, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Subscription confirmation sent to ${email}`);

    res.status(201).json({ success: true, message: "Subscribed successfully" });
  } catch (err) {
    console.error("Subscription Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// Start Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
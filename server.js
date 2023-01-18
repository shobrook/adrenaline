/* Third-party packages */

const express = require("express");
const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const path = require("path");

/* Initialize app and DB connection */

const app = express();
const publicPath = path.join(__dirname, "client", "build");
const port = process.env.PORT || 3000;
const mongoDbUri = process.env.MONGODB_URI;

// Connect to DB
mongoose.connect(mongoDbUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log('MongoDB error: ', err));

// Initialize middleware
const corsOptions = {
  origin: 'https://useadrenaline.com',
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  methods: ['POST']
}
app.use(cors(corsOptions));
app.use(express.static(publicPath));
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

/* DB models */

const Schema = mongoose.Schema;
const accountSchema = new Schema({
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

const Account = mongoose.model("Account", accountSchema);

/* Routes */

// API endpoints
app.post('/api/register', [
    check('email').isEmail().withMessage('Invalid email'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, accountAlreadyExists: false });
    }

    try {
        let existingAccount = await Account.findOne({ email: req.body.email });
        if (existingAccount) {
            return res.status(400).json({ success: false, accountAlreadyExists: true });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        let newAccount = new Account({
            email: req.body.email,
            password: hashedPassword
        });

        await newAccount.save();

        res.status(200).json({ success: true, accountAlreadyExists: false });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, accountAlreadyExists: false });
    }
});
app.post('/api/login', [
    check('email').isEmail().withMessage('Invalid email'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, isWrongPassword: false, isInvalidLogin: false });
    }

    try {
        let account = await Account.findOne({ email: req.body.email });
        if (!account) {
            return res.status(404).json({ success: false, isWrongPassword: false, isInvalidAccount: true});
        }

        const isMatch = await bcrypt.compare(req.body.password, account.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, isWrongPassword: true, isInvalidAccount: false });
        }
        res.status(200).json({ success: true, isWrongPassword: false, isInvalidAccount: false });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, isWrongPassword: false, isInvalidAccount: false });
}
});

// Serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// Starts the app
app.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});

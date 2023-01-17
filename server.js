const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const cors = require('cors');

const app = express();
const publicPath = path.join(__dirname, 'build');
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(publicPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get("/playground", (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});

const Account = require('./src/models/account');

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log('MongoDB error: ', err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

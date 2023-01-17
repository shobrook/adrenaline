const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const app = express();
const publicPath = path.join(__dirname, 'build');
const port = process.env.PORT || 3000;

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
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let existingAccount = await Account.findOne({ email: req.body.email });
        if (existingAccount) {
            return res.status(400).json({ errors: [{ msg: 'Email already in use' }] });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        let newAccount = new Account({
            email: req.body.email,
            password: hashedPassword
        });

        await newAccount.save();

        res.status(200).json({ message: 'Registration successful'});
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error registering new account'});
    }
});

app.post('/api/login', [
    check('email').isEmail().withMessage('Invalid email\n'),
    check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        let account = await Account.findOne({ email: req.body.email });
        if (!account) {
            return res.status(404).json({ message: 'No account found'});
        }

        const isMatch = await bcrypt.compare(req.body.password, account.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password'});
        }
        res.status(200).json({ message: 'Login successful' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Error logging in'});
}
});

app.use(express.static(publicPath));
app.get('*', (req, res) => {
res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}!`);
});

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const publicPath = path.join(__dirname, 'build');
const port = process.env.PORT || 3000;

const Account = require('./models/account');

mongoose.connect('mongodb://localhost/accounts_db', { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/register', (req, res) => {
    let newAccount = new Account({
        email: req.body.email,
        password: req.body.password
    });
    newAccount.save()
        .then(() => res.status(200).send('Registration successful'))
        .catch(err => res.status(500).send('Error registering new account'));
});

app.post('/api/login', (req, res) => {
    Account.findOne({ email: req.body.email })
        .then(account => {
            if (!account) {
                res.status(404).send('No account found');
            } else if (account.password === req.body.password) {
                res.status(200).send('Login successful');
            } else {
                res.status(401).send('Incorrect password');
            }
        })
        .catch(err => res.status(500).send('Error logging in'));
});

app.use(express.static(publicPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is up on port ${port}!`);
});

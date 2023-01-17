const express = require('express');
const router = express.Router();
const Account = require('../models/account');

router.post('/register', (req, res) => {
    let newAccount = new Account({
        email: req.body.email,
        password: req.body.password
    });
    newAccount.save()
        .then(() => res.status(200).send('Registration successful'))
        .catch(err => res.status(500).send('Error registering new account'));
});

router.post('/login', (req, res) => {
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

module.exports = router;


router.get('/accounts', (req, res) => {
    Account.find({}, (err, accounts) => {
        if (err) {
            res.status(500).send('Error fetching accounts from the database');
        } else {
            res.status(200).send(accounts);
        }
    });
});

router.get('/account/:id', (req, res) => {
    Account.findById(req.params.id, (err, account) => {
        if (err) {
            res.status(500).send('Error fetching account from the database');
        } else if (!account) {
            res.status(404).send('Account not found');
        } else {
            res.status(200).send(account);
        }
    });
});

router.post('/account', (req, res) => {
    let newAccount = new Account({
        email: req.body.email,
        password: req.body.password
    });
    newAccount.save((err) => {
        if (err) {
            res.status(500).send('Error saving account to the database');
        } else {
            res.status(200).send('Account saved successfully');
        }
    });
});

router.put('/account/:id', (req, res) => {
    Account.findByIdAndUpdate(req.params.id, {
        email: req.body.email,
        password: req.body.password
    }, (err) => {
        if (err) {
            res.status(500).send('Error updating account');
        } else {
            res.status(200).send('Account updated successfully');
        }
    });
});

router.delete('/account/:id', (req, res) => {
    Account.findByIdAndDelete(req.params.id, (err) => {
        if (err) {
            res.status(500).send('Error deleting account');
        } else {
            res.status(200).send('Account deleted successfully');
        }
    });
});

module.exports = router;

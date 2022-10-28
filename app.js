const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const mysql = require('mysql');
const mysql2 = require('mysql2');
const fs = require('fs');
const request = require('request');
const bcrypt = require('bcrypt');
const html = require('html');
const pug = require('pug');
const saltRounds = 10;
const cookieParser = require('cookie-parser');
const TokenGenerator = require('uuid-token-generator');

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'pug');

var con = mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    if (req.cookies['app-token']) {
        const token = req.cookies['app-token'];
        con.query("SELECT * FROM users WHERE token = ?", [token], function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                if (result[0].token === token) {
                    res.redirect('/portal');
                } else {
                    res.render('login');
                }
            } else {
                res.render('login');
            };
        });
    } else {
        res.render('login');
    };
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    con.query("SELECT * FROM users WHERE username = ?", [username], function (err, result, fields) {
        if (err) throw err;
        if (result.length > 0) {
            bcrypt.compare(password, result[0].password, function(err, result2) {
                if (err) throw err;
                if (result2 === true) {
                    res.cookie('app-token',result[0].token);
                    res.redirect('./portal');
                } else {
                    res.redirect('./login');
                }
            });
        } else {
            res.redirect('/login');
        };
    });
});

app.get('/signup', (req, res) => {
    if (req.cookies['app-token']) {
        const token = req.cookies['app-token'];
        con.query("SELECT * FROM users WHERE token = ?", [token], function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                if (result[0].token === token) {
                    res.redirect('/portal');
                } else {
                    res.render('signup');
                }
            } else {
                res.render('signup');
            };
        });
    } else {
        res.render('signup');
    };
});

app.post('/signup', (req, res) => {
    if (req.body.password === req.body.password2) {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        const tokenGen = new TokenGenerator(256, TokenGenerator.BASE62);
        const token = tokenGen.generate();

        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(password, salt, function(err, hash) {
                con.query("SELECT * FROM users WHERE username = ? OR email = ?", [username, email], function (err, result, fields) {
                    if (err) throw err;
                    if (result.length > 0) {
                        res.redirect('/signup');
                    } else {
                        con.query("insert into users (username, email, password, token) values (?, ?, ?, ?);", [username, email, hash, token], function (err, result, fields) {
                            if (err) throw err;
                            con.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, hash], function (err, result, fields) {
                                if (err) throw err;
                                if (result.length > 0) {
                                    res.cookie('app-token',result[0].token);
                                    res.redirect('./portal');
                                } else {
                                    res.redirect('/login');
                                };
                            });
                        });
                    };
                });
            });
        });
    } else {
        res.redirect('/signup');
    }
});

app.get('/portal', (req, res) => {
    if (req.cookies['app-token']) {
        const token = req.cookies['app-token'];
        con.query("SELECT * FROM users WHERE token = ?", [token], function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                if (result[0].token === token) {
                    res.render('portal', { username: result[0].username});
                } else {
                    res.redirect('/login');
                }
            } else {
                res.redirect('/login');
            };
        });
    } else {
        res.redirect('/login');
    };
});

app.post('/logout', (req, res ) => {
    res.clearCookie('app-token');
    res.redirect('/login');
});

app.listen(80, () => {
    console.log('MySQL Login System Server listening on port 3000!');
});
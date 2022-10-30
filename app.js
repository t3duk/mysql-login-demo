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
const nodemailer = require('nodemailer');
const TokenGenerator = require('uuid-token-generator');
require('dotenv').config()

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set('view engine', 'pug');

var con = mysql2.createConnection({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME
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

app.get('/changepassword', (req, res) => {
    if (req.cookies['app-token']) {
        const token = req.cookies['app-token'];
        con.query("SELECT * FROM users WHERE token = ?", [token], function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                if (result[0].token === token) {
                    res.render('changepassword');
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

app.post('/changepassword', (req, res) => {
    if (req.cookies['app-token']) {
        const token = req.cookies['app-token'];
        con.query("SELECT * FROM users WHERE token = ?", [token], function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                if (result[0].token === token) {
                    // valid token
                    const oldpassword = req.body.oldpassword;
                    const retypepassword = req.body.retypepassword;
                    const password = req.body.password;

                    if (password === retypepassword) {
                        bcrypt.compare(oldpassword, result[0].password, function(err, result2) {
                            if (err) throw err;
                            if (result2 === true) {
                                // hash the new password
                                bcrypt.genSalt(saltRounds, function(err, salt) {
                                    bcrypt.hash(password, salt, function(err, hash) {
                                        con.query("UPDATE users SET password = ? WHERE token = ?", [hash, token], function (err, result, fields) {
                                            if (err) throw err;
                                            const tokenGen = new TokenGenerator(256, TokenGenerator.BASE62);
                                            const token = tokenGen.generate();
                                            con.query("UPDATE users SET token = ? WHERE password = ?", [token, hash], function (err, result4, fields) {
                                                if (err) throw err;
                                                res.cookie('app-token',token);
                                                res.redirect('/portal');
                                            });
                                        });
                                    });
                                });
                            } else {
                                res.redirect('/changepassword');
                            }
                        });
                    } else {
                        res.redirect('/changepassword');
                    };
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

app.get('/logout', (req, res) => {
    redirect('/portal');
});

app.post('/logout', (req, res ) => {
    res.clearCookie('app-token');
    res.redirect('/login');
});

app.get('/resetpassword', (req, res ) => {
    if (req.cookies['app-token']) {
        const token = req.cookies['app-token'];
        con.query("SELECT * FROM users WHERE token = ?", [token], function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) {
                if (result[0].token === token) {
                    res.render('portal', { username: result[0].username});
                } else {
                    res.render('resetpassword');
                }
            } else {
                res.render('resetpassword');
            };
        });
    } else {
        res.render('resetpassword');
    };
});

app.post('/resetpassword', (req, res ) => {
    const email = req.body.email;
    con.query("SELECT * FROM users WHERE email = ?", [email], function (err, result, fields) {
        if (err) throw err;
        if (result.length > 0) {
            const tokenGen = new TokenGenerator(256, TokenGenerator.BASE62);
            const token = tokenGen.generate();
            con.query("UPDATE users SET resettoken = ? WHERE email = ?", [token, email], function (err, result, fields) {
                if (err) throw err;
                const code = Math.floor(100000 + Math.random() * 999999);
                con.query("UPDATE users SET resetcode = ? WHERE resettoken = ?", [code, token], function (err, result, fields) {
                    if (err) throw err;
                    console.log(code);
                    res.cookie('email-token',token);
                    res.render('entercode', { code: code });
                });
            });
        } else {
            res.redirect('/resetpassword');
        };
    });
});

app.get('/entercode', (req, res ) => {
    res.redirect('/resetpassword');
});

app.post('/entercode', (req, res ) => {
    const code = req.body.code;
    const emailtoken = req.cookies['email-token'];
    const newpass = req.body.newpassword;
    const retypepass = req.body.retypepassword;
    con.query("SELECT * FROM users WHERE resettoken = ? AND resetcode = ?", [emailtoken, code], function (err, resultcc, fields) {
        if (err) throw err;
        if (resultcc.length > 0) {
            if (newpass === retypepass) {
                con.query("UPDATE users SET resettoken = ? WHERE id = ?", [null, resultcc[0].id], function (err, resultz, fields) {
                    if (err) throw err;
                    con.query("UPDATE users SET resetcode = ? WHERE id = ?", [null, resultcc[0].id], function (err, result, fields) {
                        if (err) throw err;
                        bcrypt.genSalt(saltRounds, function(err, salt) {
                            bcrypt.hash(retypepass, salt, function(err, hash) {
                                con.query("UPDATE users SET password = ? WHERE id = ?", [hash, resultcc[0].id], function (err, result, fields) {
                                    if (err) throw err;
                                    res.clearCookie('email-token');
                                    const tokenGen = new TokenGenerator(256, TokenGenerator.BASE62);
                                    const ntoken = tokenGen.generate();
                                    con.query("UPDATE users SET token = ? WHERE password = ?", [ntoken, hash], function (err, result4, fields) {
                                        if (err) throw err;
                                        res.redirect('/login');
                                    });
                                });
                            });
                        });
                    });
                });
            } else {
                res.render('entercode');
            }
        } else {
            res.clearCookie('email-token');
            res.redirect('/resetpassword');
        };
    });
});

app.listen(process.env.PORT, () => {
    console.log('MySQL Login System Server listening on port 3000!');
});
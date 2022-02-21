const express = require("express");
const app = express();
const db = require("./database/db");
const cookieSession = require("cookie-session");
const { engine } = require("express-handlebars");
const { compare, hash } = require("./bc");

app.use(cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true
    })
);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));

app.get("/petition/register", (req, res) => {
    res.render("register")
});

app.post("/petition/register", (req, res) => {
    const { first, last, email, password } = req.body; 
    if ( first !== "" || last !== "" || email !== "" || password !== "" ) {
        hash(password)
        .then(hashedPassoword => {
            db.addUser(first, last, email, hashedPassoword)
            .then(({ rows }) => {
                console.log("id after POST in /register: ", rows[0].id)
                req.session.userId = rows[0].id;
                res.redirect("/petition");
            })
        })
        .catch(err => {
            console.log("err hashing password", err);
            res.render("register", {
                error: "Ops, something went wrong! Please try again."
            });
        })
    } else {
        res.render("register", {
            error: "Ops, something went wrong! Please try again."
        });
    }
});

app.get("/petition/login", (req, res) => {
    res.render("login");
});

app.post("/petition/login", (req, res) => {
    let hashedPassword = "";
    let userId;
    const { email, password } = req.body;

    db.getUserHashedPasswordAndId(email)
    .then(({ rows }) => {
        hashedPassword = rows[0].password;
        userId = rows[0].id;
    })
    .then(() => {
        compare(password, hashedPassword)
        .then(isMatch => {
            isMatch ? 
                req.session.userId = userId 
                :
                res.render("login", {
                    error: "Ops, something went wrong! Please try again."
                });
        })
        .then(() => {
            db.getSignature(userId)
            .then(({ rows }) => {
                if (rows[0].signature) {
                    req.session.hasSigned = true;
                    res.redirect("/petition/thanks");
                } else {
                    res.redirect("/petition");
                }
            })
            .catch((err) => {
                console.log("error trying to get signature: ", err);
                res.render("login", {
                    error: "Ops, something went wrong! Please try again.",
                })
            });
        })
    })
    .catch(err => {
        console.log("error getting password: ", err);
        res.render("login", {
            error: "Ops, something went wrong! Please try again."
        });
    })
});

app.get("/petition", (req, res) => {
    console.log("GET request at /petition");
    console.log("req.session at GET /petition route: ", req.session);

    if (!req.session.userId) {
        res.redirect("/petition/login");
    } else if (req.session.hasSigned) {
        res.redirect("/petition/thanks") 
    } else {
        res.render("petition");
    }
});

app.post('/petition', (req, res) => {
    const { signature } = req.body;
    if (signature === '') {
        res.render("petition", {
            error: "Ops! You must fill in all the fields bellow to proceed!"
        });
    } else {
        db.addPersonSignature(signature, req.session.userId)
        .then(() => {
            req.session.hasSigned = true;
            console.log("POST request at /petition");
            console.log("req.session at POST /petition route: ", req.session);
            res.redirect("/petition/thanks");
        })
        .catch(err => console.log(err));
    }
});

app.get("/petition/thanks", (req, res) => {
    if (req.session.hasSigned) {
        let signatureURL;
        db.getSignature(req.session.userId)
        .then(({ rows }) => {
            signatureURL = rows[0].signature;
        })
        .then(() => {
            db.countSigners()
            .then(({ rows }) => {
                console.log("GET request at /petition/thanks -> count of signers: ", rows[0].count);
                res.render("thanks", {
                    numberOfSigners: rows[0].count,
                    signatureURL: signatureURL
                });
            })
        })
        .catch(err => console.log(err));
    } else {
        res.redirect("/petition");
    }
});

app.get("/petition/signers", (req, res) => {
    if (req.session.userId) {
        db.getAllSignersNames()
            .then(({ rows }) => {
                console.log("GET request at /petition/signers");
                res.render("signers", {
                    signers: rows,
                });
            })
            .catch((err) => console.log(err));
    } else {
        res.redirect("/petition");
    }
});

app.get("/petition/logout", (req, res) => {
    req.session = null;
    res.redirect("/petition/login");
});

app.listen(8080, () => console.log("Server listening..."));
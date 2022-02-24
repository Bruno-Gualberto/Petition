const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { compare, hash } = require("../bc");
const { requireLoggedOutUser, requireNoSignature } = require("../middleware");

// ***** GET & POST for /REGISTER *****

router.get("/register", requireLoggedOutUser, requireNoSignature, (req, res) => {
    console.log("GET request at /register");
    return res.render("register");
});

router.post("/register", requireLoggedOutUser, requireNoSignature, (req, res) => {
    const { first, last, email, password } = req.body;
    if (first !== "" || last !== "" || email !== "" || password !== "") {
        hash(password).then(hashedPassoword => {
            db.addUser(first, last, email, hashedPassoword).then(({ rows }) => {
                console.log("id after POST in /register: ", rows[0].id);
                req.session.userId = rows[0].id;
                req.session.fromRegister = true;
                return res.redirect("/petition/profile");
            });
        })
        .catch(err => {
            console.log("err hashing password", err);
            return res.render("register", {
                error: "Ops, something went wrong! Please try again.",
            });
        });
    } else {
        return res.render("register", {
            error: "Ops, something went wrong! Please try again.",
        });
    }
});

// ***** GET & POST for /LOGIN *****

router.get("/login", requireLoggedOutUser, requireNoSignature, (req, res) => {
    console.log("GET request at /login");
    return res.render("login");
});

router.post("/login", requireLoggedOutUser, requireNoSignature,(req, res) => {
    let hashedPassword = "";
    let userId;
    const { email, password } = req.body;

    db.getUserHashedPasswordAndId(email).then(({ rows }) => {
        hashedPassword = rows[0].password;
        userId = rows[0].id;
    }).then(() => {
        compare(password, hashedPassword).then(isMatch => {
            if (!isMatch) {
                return res.render("login", {
                    error: "Ops, something went wrong! Please try again."
                });
            } else {
                req.session.userId = userId 

                db.getSignature(userId).then(({ rows }) => {
                    !rows[0] ? 
                    res.redirect("/petition") 
                    :
                    req.session.hasSigned = true; 
                    return res.redirect("/petition/thanks");
                })
                .catch(err => {
                    console.log("error trying to get signature: ", err);
                    return res.render("login", {
                        error: "Ops, something went wrong! Please try again.",
                    })
                });
            }
        })
        .catch(err => console.log("error on match: ", err))
    })
    .catch(err => {
        console.log("error getting password: ", err);
        return res.render("login", {
            error: "Ops, something went wrong! Please try again."
        });
    })
});

module.exports = router;
const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { hash } = require("../bc");
const { requireLoggedInUser, requireSignature, requireFromRegister } = require("../middleware");

// ***** GET & POST for /PROFILE *****
router.get("/profile", requireFromRegister, (req, res) => {
        delete req.session.fromRegister;
        return res.render("profile");
    });

router.post("/profile", (req, res) => {
    console.log("POST request at /petition/profile");
    let { age, city, url } = req.body;

    if (age === "" && city === "" && url === "") {
        return res.redirect("/petition/thanks");
    } else {
        if (!url.startsWith("http") && url !== "") {
            return res.render("profile", {
                error: "Sorry, but you must put a valid url.",
            });
        } else {
            age === "" ? (age = null) : (age = parseInt(age));

            db.addUserProfile(age, city, url, req.session.userId).then(() => {
                return res.redirect("/petition/thanks")
            });
        }
    }
});

// ***** GET & POST for /EDIT *****
let myRows;
router.get("/edit", requireLoggedInUser, requireSignature, (req, res) => {
    console.log("GET request at /petition/edit");
    db.getUserFullProfile(req.session.userId).then(({ rows }) => {
        myRows = rows;
        return res.render("edit", {
            userFullProfile: rows
        });
    })
    .catch(err => console.log("error getting the user profile on /edit: ", err));
});

router.post("/edit", requireLoggedInUser, requireSignature, (req, res) => {
    let { first, last, email, password, age, city, url } = req.body;
    age === "" ? (age = null) : (age = parseInt(age));
    console.log("POST request at /petition/edit");

    if (first && last && email) {
        if (password) {
            hash(password).then(hashedPassword => {
                db.updateUserWithPassword(first, last, email, hashedPassword, req.session.userId)
                    .catch(err => console.log("error updating user data WITH password: ", err));
                }).then(() => {
                    if (url.startsWith("http") || !url) {
                        db.upsertUserProfile(age, city, url, req.session.userId).then(() => {
                            return res.redirect("/petition/thanks")
                        })
                        .catch(err => console.log("error updating user profile: ", err));
                        } else {
                            return res.render("edit", {
                                userFullProfile: myRows,
                                error: "Ops! Something went wrong!"
                            });
                        }
                })
                .catch(err => console.log("error hashing password at /edit: ", err));
        } else {
            db.updateUser(first, last, email, req.session.userId)
            .catch(err => console.log("error updating user data WITHOUT password: ", err));

            if (url.startsWith("http") || !url) {
                db.upsertUserProfile(age, city, url, req.session.userId).then(() => {
                    return res.redirect("/petition/thanks")  
                })
                .catch(err => console.log("error updating user profile: ", err));
            } else {
                return res.render("edit", {
                    userFullProfile: myRows,
                    error: "Ops! Something went wrong!"
                });
            }
        }
    } else {
        return res.render("edit", {
            userFullProfile: myRows,
            error: "Ops! Something went wrong!",
        });
    }
});

module.exports = router;
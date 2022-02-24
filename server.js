const express = require("express");
const app = express();
const db = require("./database/db");
const cookieSession = require("cookie-session");
const { engine } = require("express-handlebars");
const { compare, hash } = require("./bc");
const { requireLoggedInUser, requireLoggedOutUser, requireNoSignature, requireSignature, requireFromRegister } = require("./middleware");

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

// ***** GET & POST for /REGISTER *****

app.get("/petition/register", requireLoggedOutUser, requireNoSignature, (req, res) => {
        console.log("GET request at /register");
        res.render("register");
});

app.post("/petition/register", requireLoggedOutUser, requireNoSignature, (req, res) => {
    const { first, last, email, password } = req.body;
    if (first !== "" || last !== "" || email !== "" || password !== "") {
        hash(password)
            .then((hashedPassoword) => {
                db.addUser(first, last, email, hashedPassoword).then(
                    ({ rows }) => {
                        console.log("id after POST in /register: ", rows[0].id);
                        req.session.userId = rows[0].id;
                        req.session.fromRegister = true;
                        res.redirect("/petition/profile");
                    }
                );
            })
            .catch((err) => {
                console.log("err hashing password", err);
                res.render("register", {
                    error: "Ops, something went wrong! Please try again.",
                });
            });
    } else {
        res.render("register", {
            error: "Ops, something went wrong! Please try again.",
        });
    }
});

// ***** GET & POST for /LOGIN *****

app.get("/petition/login", requireLoggedOutUser, requireNoSignature, (req, res) => {
    console.log("GET request at /login");
    res.render("login");
});

app.post("/petition/login", requireLoggedOutUser, requireNoSignature,(req, res) => {
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
            if (!isMatch) {
                res.render("login", {
                    error: "Ops, something went wrong! Please try again."
                });
            } else {
                req.session.userId = userId 

                db.getSignature(userId)
                .then(({ rows }) => {
                    !rows[0] ? 
                        res.redirect("/petition") 
                        :
                        req.session.hasSigned = true; 
                        res.redirect("/petition/thanks");
                })
                .catch((err) => {
                    console.log("error trying to get signature: ", err);
                    res.render("login", {
                        error: "Ops, something went wrong! Please try again.",
                    })
                });
            }
        })
        .catch(err => console.log("error on match: ", err))
    })
    .catch(err => {
        console.log("error getting password: ", err);
        res.render("login", {
            error: "Ops, something went wrong! Please try again."
        });
    })
});

// ***** GET & POST for /PETITION *****

app.get("/petition", requireLoggedInUser, requireNoSignature, (req, res) => {
    console.log("GET request at /petition");
    console.log("req.session at GET /petition route: ", req.session);
    
    res.render("petition");
});

app.post('/petition', requireLoggedInUser, requireNoSignature, (req, res) => {
    const { signature } = req.body;
    if (signature === '') {
        res.render("petition", {
            error: "Ops! You must sign to proceed!"
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

// ***** GET & POST for /THANKS *****

app.get("/petition/thanks", requireLoggedInUser, requireSignature, (req, res) => {
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
});

app.post("/petition/thanks", requireLoggedInUser, requireSignature, (req, res) => {
    db.deleteSignature(req.session.userId)
    .then(() => {
        delete req.session.hasSigned;
        res.redirect("/petition");
    })
    .catch(err => console.log("error deleting signature: ", err));
});

// ***** GET for /SIGNERS *****

app.get("/petition/signers", requireLoggedInUser, requireSignature, (req, res) => {
    db.getAllSignersInfo()
        .then(({ rows }) => {
            console.log("GET request at /petition/signers");
            res.render("signers", {
                helpers: {
                    toLowerCase(text) {
                        return text.toLowerCase();
                    }
                },  
                signers: rows
            });
        })
        .catch((err) => console.log("error on getting all signers info: ", err));
});

// ***** GET & POST for /PROFILE *****

app.get("/petition/profile", requireFromRegister,(req, res) => {
    delete req.session.fromRegister;
    res.render("profile");
});

app.post("/petition/profile", (req, res) => {
    console.log("POST request at /petition/profile");
    let { age, city, url } = req.body;
    
    if (age === "" && city === "" && url === "") {
        res.redirect("/petition/thanks");
    } else {
        if (!url.startsWith("http") && url !== "") {
            res.render("profile", {
                error: "Sorry, but you must put a valid url."
            });
        } else {
            age === "" ? age = null : age = parseInt(age);

            db.addUserProfile(age, city, url, req.session.userId)
            .then(() => res.redirect("/petition/thanks"))
        }
    }
});

// ***** GET for /CITY_SIGNERS *****

app.get("/petition/signers/:city", requireLoggedInUser, requireSignature, (req, res) => {
    console.log("GET request at /petition/signers/:city")
    const { city } = req.params
    const cityWithCapitalLetter = city.replace(city.charAt(0), city.charAt(0).toUpperCase());

    db.getCitySigners(city)
    .then(({ rows }) => {
        res.render("city_signers", {
            city: cityWithCapitalLetter,
            signers: rows
        })
    })
});

// ***** GET & POST for /EDIT *****

app.get("/petition/edit", requireLoggedInUser, requireSignature, (req, res) => {
    console.log("GET request at /petition/edit");
    db.getUserFullProfile(req.session.userId)
    .then(({ rows }) => {
        res.render("edit", {
            userFullProfile: rows,
            error: "All the fields with * are mandatory"
        });
    })
    .catch(err => console.log("error getting the user profile on /edit: ", err));
});

app.post("/petition/edit", requireLoggedInUser, requireSignature, (req, res) => {
    let { first, last, email, password, age, city, url } = req.body;
    age === "" ? age = null : age = parseInt(age);
    console.log("POST request at /petition/edit");

    if (first && last && email) {
        if (password) {
            hash(password)
            .then(hashedPassword => {
                db.updateUserWithPassword(first, last, email, hashedPassword, req.session.userId)
                .catch(err => console.log("error updating user data WITH password: ", err))
            })
            .then(() => {
                if (url.startsWith("http") || !url) {
                    db.upsertUserProfile(age, city, url, req.session.userId)
                    .then(() => res.redirect("/petition/thanks"))
                    .catch(err => console.log("error updating user profile: ", err))
                } else {
                    res.redirect("/petition/edit");
                }
            })
            .catch(err => console.log("error hashing password at /edit: ", err))
        } else {
            db.updateUser(first, last, email, req.session.userId)
            .catch(err => console.log("error updating user data WITHOUT password: ", err))

            if (url.startsWith("http") || !url) {
                db.upsertUserProfile(age, city, url, req.session.userId)
                .then(() => res.redirect("/petition/thanks"))
                .catch((err) => console.log("error updating user profile: ", err));
            } else {
                res.redirect("/petition/edit");
            }
        }
    } else {
        res.redirect("/petition/edit");
    }
});

// *****GET for /GOODBYE *****

app.get("/petition/goodbye", requireLoggedInUser, (req, res) => {
    db.deleteSignature(req.session.userId)
    .then(() => db.deleteUserProfile(req.session.userId))
    .then(() => db.deleteUser(req.session.userId))
    .then(() => {
        req.session = null;
        res.render("deleted");
    })
});

// ***** GET for /LOGOUT *****

app.get("/petition/logout", requireLoggedInUser, (req, res) => {
    req.session = null;
    res.redirect("/petition/login");
});

app.listen(process.env.PORT || 8080, () => console.log("Server listening..."));
// basic server setup
const express = require("express");
const app = express();
const db = require("./database/db");
const cookieSession = require("cookie-session");
const { engine } = require("express-handlebars");

app.use(cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
    })
);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));

app.get("/petition", (req, res) => {
    console.log("GET request at /petition");
    console.log("req.session at GET /petition route: ", req.session);

    req.session.signatureId ? res.redirect("/petition/thanks") : res.render("petition");
});

app.post('/petition', (req, res) => {
    const { first, last, signature } = req.body;
    if (first === '' || last === '' || signature === '') {
        res.render("petition", {
            error: "Ops! You must fill in all the fields bellow to proceed!"
        });
    } else {
        db.addPerson(first, last, signature)
        .then(({ rows }) => {
            req.session.signatureId = rows[0].id;
            console.log("cookie at POST request on /petition", req.session.signatureId)
            console.log("successfull POST made at /petition");
            res.redirect("/petition/thanks");
        })
        .catch(err => console.log(err));
    }
});

app.get("/petition/thanks", (req, res) => {
    if (req.session.signatureId) {
        let signatureURL;
        db.getSignatureId(req.session.signatureId)
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
    if (req.session.signatureId) {
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
    res.redirect("/petition");
});

app.listen(8080, () => console.log("Server listening..."));
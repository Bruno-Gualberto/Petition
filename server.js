// basic server setup
const express = require("express");
const app = express();
const db = require("./database/db");

const { engine } = require("express-handlebars");

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(express.static("./public"));
app.use(express.urlencoded({ extended: false }));

app.get("/petition", (req, res) => {
    console.log("GET request at /petition");
    res.render("petition");
});

app.post('/petition', (req, res) => {
    const { first, last, signature } = req.body;
    if (first === '' || last === '' || signature === '') {
        res.render("petition", {
            error: "Ops! You must fill in all the fields bellow to proceed!"
        });
    } else {
        db.addPerson(first, last, signature)
        .then(() => {
            console.log("successfull POST made at /petition");
            res.redirect("/petition/thanks");
        })
        .catch(err => console.log(err));
    }
});

app.get("/petition/thanks", (req, res) => {
    db.countSigners()
    .then(({ rows }) => {
        console.log("GET request at /petition/thanks -> count of signers: ", rows[0].count)
        res.render("thanks", {
            numberOfSigners: rows[0].count
        });
    })
    .catch(err => console.log(err))
});

app.get("/petition/signers", (req, res) => {
    db.getAllSignersNames()
    .then(({ rows }) => {
        console.log("GET request at /petition/signers")
        res.render("signers", {
            signers: rows
        });
    })
    .catch(err => console.log(err))
});

app.listen(8080, () => console.log("Server listening..."));
const express = require("express");
const router = express.Router();
const db = require("../database/db");
const { requireLoggedInUser, requireNoSignature, requireSignature } = require("../middleware");

// ***** GET and POST for /PETITION *****
router.get("/", requireLoggedInUser, requireNoSignature, (req, res) => {
    console.log("GET request at /petition");
    console.log("req.session at GET /petition route: ", req.session);

    return res.render("petition");
});

router.post("/", requireLoggedInUser, requireNoSignature, (req, res) => {
    const { signature } = req.body;
    if (signature === "") {
        return res.render("petition", {
            error: "Ops! You must sign to proceed!",
        });
    } else {
        db.addPersonSignature(signature, req.session.userId).then(() => {
            req.session.hasSigned = true;
            console.log("POST request at /petition");
            console.log("req.session at POST /petition route: ", req.session);
            return res.redirect("/petition/thanks");
        })
        .catch(err => console.log("error on adding signature", err));
    }
});

// ***** GET & POST for /THANKS *****

router.get("/thanks", requireLoggedInUser, requireSignature, (req, res) => {
    let signatureURL;
    db.getSignature(req.session.userId).then(({ rows }) => {
        signatureURL = rows[0].signature;
    })
    .then(() => {
        db.countSigners().then(({ rows }) => {
            console.log("GET request at /petition/thanks -> count of signers: ", rows[0].count);
            return res.render("thanks", {
                numberOfSigners: rows[0].count,
                signatureURL: signatureURL
            });
        })
    })
    .catch(err => console.log(err));
});

router.post("/thanks", requireLoggedInUser, requireSignature, (req, res) => {
    db.deleteSignature(req.session.userId).then(() => {
        delete req.session.hasSigned;
        return res.redirect("/petition");
    })
    .catch(err => console.log("error deleting signature: ", err));
});

module.exports = router;
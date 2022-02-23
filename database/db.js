// here I write my queries and each one should be a function
const spicedPg = require("spiced-pg");

// makes a conection with the database
const db = spicedPg(`postgres:postgres:postgres@localhost:5432/petition`);

module.exports.addUser = (first, last, email, password) => {
    return db.query(`
        INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `, [first, last, email, password]);
}

module.exports.getAllSignersInfo = () => {
    return db.query(`
        SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url, signatures.user_id
        FROM users
        FULL OUTER JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id;
    `);
}

module.exports.addPersonSignature = (signature, userId) => {
    return db.query(`
        INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2)
        RETURNING user_id
    `, [signature, userId]);
}

module.exports.countSigners = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`);
}

module.exports.getSignature = userId => {
    return db.query(`SELECT signature FROM signatures WHERE user_id = $1`, [userId]);
}

module.exports.getUserHashedPasswordAndId = userEmail => {
    return db.query(`SELECT password, id FROM users WHERE email = $1`, [userEmail])
}

module.exports.addUserProfile = (age, city, url, userId) => {
    return db.query(`
        INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING user_id
    `, [age, city, url, userId])
}

module.exports.getCitySigners = city => {
    return db.query(`
        SELECT users.first, users.last, user_profiles.age, user_profiles.url
        FROM user_profiles 
        FULL OUTER JOIN users
        ON user_profiles.user_id = users.id
        JOIN signatures
        ON users.id = signatures.user_id
        WHERE LOWER(user_profiles.city) = LOWER($1);
        `, [city]
    );
}

module.exports.getUserFullProfile = userId => {
    return db.query(`
        SELECT users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        FULL OUTER JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1
    `, [userId]);
}
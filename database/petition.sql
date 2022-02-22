DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    first           VARCHAR(255) NOT NULL CHECK (first != ''),
    last            VARCHAR(255) NOT NULL CHECK (last != ''),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id),
    signature   TEXT NOT NULL CHECK (signature != '')
);

CREATE TABLE user_profiles(
  id SERIAL PRIMARY KEY,
  age INT,
  city VARCHAR,
  url VARCHAR,
  user_id INT NOT NULL UNIQUE REFERENCES users(id)
);

-- SELECT users.first, users.last, user_profiles.age, user_profiles.url, signatures.user_id
-- FROM users
-- FULL OUTER JOIN user_profiles
-- ON users.id = user_profiles.user_id
-- JOIN signatures
-- ON users.id = signatures.user_id;

-- SELECT users.first, users.last, user_profiles.age, user_profiles.url
-- FROM user_profiles WHERE LOWER(city) = LOWER($1)
-- FULL OUTER JOIN users
-- ON user_profiles.user_id = users.id

SELECT users.first, users.last, user_profiles.age, user_profiles.url
FROM user_profiles 
FULL OUTER JOIN users
ON user_profiles.user_id = users.id
JOIN signatures
ON users.id = signatures.user_id
WHERE LOWER(user_profiles.city) = LOWER($1);
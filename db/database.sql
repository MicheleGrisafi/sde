DROP DATABASE if exists sde;
CREATE DATABASE sde;
USE sde;

CREATE TABLE users(
    id          INT AUTO_INCREMENT,
	email       VARCHAR(255),
	password    VARCHAR(255), /*TODO: hash password */
    apiToken    TEXT,
    providerToken TEXT DEFAULT NULL,
    provider    BIT(2) DEFAULT NULL, /* 1 for ONENOTE and 2 for EVERNOTE */
	PRIMARY KEY(id)
);

/*** NOTES ***/

CREATE TABLE notes(
	id INT AUTO_INCREMENT,
	title VARCHAR(255) NOT NULL, /* maybe it can be null? */
	content TEXT,
	owner VARCHAR(255) NOT NULL,
	shared VARCHAR(255),
	status TINYINT DEFAULT 0, /* 0 -> not shared; 1 -> pending; 2-> shared*/
	PRIMARY KEY (id),
	FOREIGN KEY (owner) REFERENCES users(email),
	FOREIGN KEY (shared) REFERENCES users(email)
); 
CREATE TABLE noteLinks(
    note INT,
    user VARCHAR(255),
    provider BIT(2),
    PRIMARY KEY (note,user,provider),
    FOREIGN KEY (note) REFERENCES notes(id)
);
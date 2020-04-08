DROP DATABASE if exists sde;
CREATE DATABASE sde;
USE sde;

CREATE TABLE users(
    id          INT AUTO_INCREMENT,
	email       VARCHAR(255) UNIQUE,
	password    VARCHAR(255), /*TODO: hash password */
    apiToken    TEXT,
    providerToken TEXT DEFAULT NULL,
    provider    TINYINT(1) DEFAULT NULL, /* 0 for ONENOTE and 1 for EVERNOTE */
	PRIMARY KEY(id)
);

/*** NOTES ***/

CREATE TABLE notes(
	id INT AUTO_INCREMENT,
	title VARCHAR(255) NOT NULL, /* maybe it can be null? */
	content TEXT,
	ownerId INT NOT NULL,
	PRIMARY KEY (id),
	CONSTRAINT FKNotesOwner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE noteShares(
    id INT AUTO_INCREMENT,
    noteId INT NOT NULL,
    userId INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fkShareNodeId FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE CASCADE, 
    CONSTRAINT fkShareUserId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE noteLinks(
    id INT AUTO_INCREMENT,
    noteId INT NOT NULL,
    userId INT NOT NULL,
    provider BIT(1) NOT NULL, /* 0 onenote 1 evernote */
    externalId INT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT FKLinkNote FOREIGN KEY (noteId) REFERENCES notes(id) ON DELETE CASCADE,
    CONSTRAINT FKLinkUser FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
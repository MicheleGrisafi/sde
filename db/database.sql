CREATE DATABASE sde;
USE sde;

CREATE TABLE user(
	INT id AUTOINCREMENT,
	VARCHAR(255) email UNIQUE,

	PRIMARY KEY(id)
);
/* provider = 1 for ONENOTE and 2 for EVERNOTE */
CREATE TABLE token(
	BIT provider,
	TEXT jsonToken, 
)
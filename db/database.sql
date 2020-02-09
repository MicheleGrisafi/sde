DROP DATABASE sde;
CREATE DATABASE sde;
USE sde;

CREATE TABLE users(
	email VARCHAR(255),
	password VARCHAR(255), /* needs to be hashed */
	PRIMARY KEY(email)
);
/* provider = 0 for local token, 1 for ONENOTE and 2 for EVERNOTE */
CREATE TABLE tokens(
	provider BIT(2),
	jsonToken JSON NOT NULL,
	owner VARCHAR(255),
	PRIMARY KEY(owner,provider),
	FOREIGN KEY(owner) REFERENCES users(email)
);

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
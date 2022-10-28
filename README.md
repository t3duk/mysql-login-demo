# MySQL Basic Login System
*Built with Pug, Tailwind, NodeJS, ExpressJS and a MySQL Database*

# Install Deps
`npm install`

Then, change the database configuration & port in the `.env` file.

Spin your server up and should all work.

# Local MYSQL Server

Step by step by step by step by step by step by step by step by step on how to use a local dev server as the database.

1. Open your MySQL console.

```
create database demodb;

use demodb;

create table users (
id int AUTO_INCREMENT,
username varchar(255),
email varchar(255),
password varchar(255),
token varchar(255,
PRIMARY KEY (id)
);
```

3. DB is setup.
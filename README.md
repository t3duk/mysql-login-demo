# MySQL Basic Login System
*Built with Pug, Tailwind, NodeJS, ExpressJS and a MySQL Database*

# Install Deps
`npm install`
# Compile CSS
`npx tailwindcss -i ./src/style.css -o ./public/style.css --minify`
# Database Structure
| id | username | email | password | token |
|----|----------|-------|----------|-------|
| AUTO_INCREMENT | username | email | password | token |

*ID must AUTO_INCREMENT and be the PRIMARY KEY.*
The command used to create the database and table will look a bit like this:
`create database mysqlbasiclogindb; use mysqlbasiclogindb; create table users (id int AUTO_INCREMENT, username varchar(255), email varchar(255), password varchar(255), token varchar(255), PRIMARY KEY (id));`

Then, change the database configuration & port in the `.env` file.

Spin your server up and should all work.

:)
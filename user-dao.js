'use strict';
/* Data Access Object (DAO) module for accessing administrators */

const db = require('./db');
const bcrypt = require('bcrypt');

exports.getAdminById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM administrators WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) 
          reject(err);
        else if (row === undefined)
          resolve({error: 'Administrator not found.'});
        else {
          // by default, the local strategy looks for "username": not to create confusion in server.js, we can create an object with that property
          const admin = {id: row.id, username: row.email, name: row.name}
          resolve(admin);
        }
    });
  });
};

exports.getAdmin = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM administrators WHERE email = ?';
      db.get(sql, [email], (err, row) => {
        if (err) 
          reject(err);
        else if (row === undefined) {
          resolve(false);
        }
        else {
          const admin = {id: row.id, username: row.email, name: row.name};
            
          // check the hashes with an async call, given that the operation may be CPU-intensive (and we don't want to block the server)
          bcrypt.compare(password, row.hash).then(result => {
            if(result)
              resolve(admin);
            else
              resolve(false);
          });
        }
    });
  });
};
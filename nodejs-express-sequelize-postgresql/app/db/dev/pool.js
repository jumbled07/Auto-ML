const { Pool } = require('pg');
const { dotenv } = require('dotenv');
require('dotenv').config();
const databaseConfig = { connectionString: process.env.DATABASE_URL };
const pool = new Pool(databaseConfig);
// const pg = require('pg')
// const pool = new pg.Pool({
// 	user: 'postgres',
//     host: 'localhost',
//     database: 'automl',
//     password: '0000',
//     port: 5235,
// });
// const pool = new pg.Pool()
// pool.connect()
//   .then(
//     client => {
//       console.log('success')
//       client.release()
//     },
//     (err) => {
//       console.log('failure', err.message, err.stack)
//     }
//   )
//   .then(
//     () => { pool.end() }
//   )

// // const pool = new Pool()
// pool.connect((err, client, release) => {
//   if (err) {
//     return console.error('Error acquiring client', err.stack)
//   }
//   client.query('SELECT NOW()', (err, result) => {
//     release()
//     if (err) {
//       return console.error('Error executing query', err.stack)
//     }
//     console.log(result.rows)
//   })
// })
// var newproject =
// 			"SELECT * FROM project";
// pool.query(newproject)
//     .then((res) => {
//     	console.log(newproject.rows);
//       console.log(res);
//       pool.end();
//     })
//     .catch((err) => {
//       console.log(err);
//       pool.end();
//     });
module.exports= pool;
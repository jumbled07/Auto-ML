// import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
const Helper = {
  /**
   * Hash Password Method
   * @param {string} password
   * @returns {string} returns hashed password
   */
  hashPassword(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8))
  },
  /**
   * comparePassword
   * @param {string} hashPassword 
   * @param {string} password 
   * @returns {Boolean} return True or False
   */
  comparePassword(hashPassword, password) {
    return bcrypt.compareSync(password, hashPassword);
  },
  /**
   * isValidEmail helper method
   * @param {string} email
   * @returns {Boolean} True or False
   */
  /**
   * Gnerate Token
   * @param {string} id
   * @returns {string} token
   */
  generateToken(id,pid) {
    const token = jwt.sign({
      userId: id
    },
      pid, { expiresIn: '7d' }
    );
    return token;
  }
}

module.exports =  Helper;
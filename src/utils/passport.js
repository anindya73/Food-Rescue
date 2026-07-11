const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

module.exports = function(passport){
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done)=>{
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
      if (!rows.length) return done(null, false, { message: 'No user found' });
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return done(null, false, { message: 'Invalid credentials' });
      return done(null, user);
    } catch(e){
      return done(e);
    }
  }));

  passport.serializeUser((user, done)=> done(null, user.id));
  passport.deserializeUser(async (id, done)=>{
    try {
      const [rows] = await pool.query('SELECT id,name,email,role,entity_id FROM users WHERE id=?', [id]);
      done(null, rows[0] || false);
    } catch(e){ done(e); }
  });
}

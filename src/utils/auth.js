function ensureAuthenticated(req, res, next){
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  req.flash('error', 'Please log in');
  return res.redirect('/login');
}
function ensureRole(roles=[]){
  if (!Array.isArray(roles)) roles=[roles];
  return (req,res,next)=>{
    if (req.isAuthenticated && req.isAuthenticated() && roles.includes(req.user.role)) return next();
    req.flash('error', 'Unauthorized');
    return res.redirect('/login');
  };
}
module.exports = { ensureAuthenticated, ensureRole };

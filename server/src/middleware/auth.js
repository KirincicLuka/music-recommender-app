/**
 * Middleware koji provjerava da li je korisnik autentificiran
 * Koristi se za zaštitu ruta koje zahtijevaju login
 */
function ensureAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Ako nije autentificiran, vraća 401 Unauthorized
  res.status(401).json({ 
    error: 'Unauthorized', 
    message: 'You must be logged in to access this resource' 
  });
}

/**
 * Middleware koji provjerava da li korisnik NIJE autentificiran
 * Koristi se za rute kao login/register koje ne smiju biti dostupne ulogovanim korisnicima
 */
function ensureGuest(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  
  // Ako je autentificiran, redirect na dashboard
  res.redirect('/dashboard');
}

module.exports = {
  ensureAuth,
  ensureGuest,
};

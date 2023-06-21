const expectedToken = process.env.TOKEN;

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  try {
    // Verify the token against the user
    if (!token || token !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authenticate;

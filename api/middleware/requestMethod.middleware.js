/**
 * By using this middleware we want to ensure that we've blocked the potential for TRACE requests.
 * We need to do this to ensure that attackers cannot utilize the TRACE HTTP method to access our
 * httpOnly cookies (TRACE doesn't respect this rule).
 * To do it, we're going to rely on a custom Express middleware that will automatically block TRACE
 * requests from any client (browser or otherwise).
 */
module.exports = (req, res, next) => {
  // NOTE: Exclude TRACE and TRACK methods to avoid XST attacks.
  const allowedMethods = [
    "OPTIONS",
    "HEAD",
    "CONNECT",
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
  ];

  if (!allowedMethods.includes(req.method)) {
    res.status(405).send(`${req.method} not allowed.`);
  }

  next();
};

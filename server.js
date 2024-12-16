const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const path = require("path");
const session = require("express-session");
const cors = require("cors"); // Import CORS

const app = express();
const PORT = 8080;
const CLIENT_ID =
  "85587380799-k5t36fd1qtdda8jv6nbe7bsk3t2iq3cc.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

// Middleware to parse JSON
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// Enable CORS middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend origin
    credentials: true, // Allow cookies and credentials
  })
);

// Initialize sessions
app.use(
  session({
    secret: "d2c8e7f3b9f8dc9d7d9f2c6e7e3f4a8d2b6f9e7f5a9c8b7d2f4a9c7e3b2f9d8", // Secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true for HTTPS
      sameSite: "Lax", // Adjust SameSite policy for session cookies
    },
  })
);

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Middleware to check if the user is logged in
function ensureLoggedIn(req, res, next) {
  if (req.session.user) {
    console.log("Logged in and session is active");
    next();
  } else {
    console.log("Not Logged in and session is inactive");
    res.redirect("/"); // Redirect to homepage if not logged in
  }
}

// app.use(
//   "/report",
//   createProxyMiddleware({
//     target: "http://34.58.174.187:5000", // Backend API
//     changeOrigin: true,
//     secure: false, // Allows HTTP (disable in production if backend is secured)
//   })
// );

// app.use(
//   "/notifications",
//   createProxyMiddleware({
//     target: "http://34.58.174.187:5000", // Backend API
//     changeOrigin: true,
//     secure: false, // Allows HTTP (disable in production if backend is secured)
//   })
// );

// app.use(
//   "/search",
//   createProxyMiddleware({
//     target: "http://34.58.174.187:5000", // Backend API
//     changeOrigin: true,
//     secure: false, // Allows HTTP (disable in production if backend is secured)
//   })
// );

// Route to serve index.html as the homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Protected route to serve child report page
app.get("/report", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "childreport.html"));
});

app.get("/notifications", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "notifications2.html"));
});

app.get("/search", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "searchinfo.html"), (err) => {
    if (err) {
      console.error("Error serving searchinfo.html:", err.message);
      res.status(500).send("Internal Server Error");
    }
  });
});

// Route to verify Google token and create a session
app.post("/verify-token", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID, // Ensure this matches your Google Client ID
    });

    const payload = ticket.getPayload();
    // Save user details in session
    req.session.user = {
      name: payload.name,
      email: payload.email,
    };

    console.log("User logged in:", req.session.user); // Debugging session
    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error("Error verifying token:", err.message);
    res.status(401).json({ error: "Invalid token" });
  }
});

// Route to log out and destroy the session
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err.message);
      return res.status(500).send("Error logging out");
    }
    res.redirect("/");
  });
});

// Debugging route to inspect session
app.get("/debug-session", (req, res) => {
  res.json({
    session: req.session,
    isLoggedIn: !!req.session.user,
  });
});

// Catch-all route for undefined endpoints
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

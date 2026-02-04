// server.js
const express = require('express');
const app = express();
const port = 3000; // Or any port you prefer

app.get('/', (req, res) => {
  res.send('Hello from the Node.js backend!');
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

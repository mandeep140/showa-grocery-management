const express = require('express');
const app = express();
const cross = require('cors');
const port = 24034;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cross('*'));

app.get('/', (req, res) => {
  res.send('Hello World!!!');
});

app.post('/data', (req, res) => {
  const receivedData = req.body;
  res.json({ message: 'Data received successfully', data: receivedData });
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
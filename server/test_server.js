const express = require('express');
const app = express();
app.get('/test', (req, res) => res.send('ok'));
app.listen(5000, () => console.log('Minimal server running on port 5000'));

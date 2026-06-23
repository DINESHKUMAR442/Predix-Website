require('dotenv').config({ path: './frontend/.env' });
const mongoose = require('mongoose');

console.log('URI:', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('OK'); process.exit(0); })
  .catch(e => { console.error('ERR', e); process.exit(1); });

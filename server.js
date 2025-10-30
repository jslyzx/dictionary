require('dotenv').config({ path: '.env' });

const app = require('./app');

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Dictionary service listening on port ${PORT}`);
});

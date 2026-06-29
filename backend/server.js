require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const app = require('./src/app');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

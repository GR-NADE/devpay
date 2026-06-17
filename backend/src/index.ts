import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startOverdueJob } from './jobs/overdueJob';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`DevPay backend running on port ${PORT}`);
  startOverdueJob();
});
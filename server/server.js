require('dotenv').config({ path: '.env' });

const http = require('http');
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
let isShuttingDown = false;

const gracefulShutdown = (signal, exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  const shutdown = () => {
    pool
      .end()
      .catch((dbError) => {
        console.error('Error closing database pool', dbError);
      })
      .finally(() => {
        process.exit(exitCode);
      });
  };

  if (!server.listening) {
    shutdown();
    return;
  }

  console.log(`${signal} received. Closing server.`);
  server.close((closeError) => {
    if (closeError) {
      console.error('Error closing server', closeError);
      shutdown();
      return;
    }

    shutdown();
  });
};

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Failed to start server', error);
  gracefulShutdown('serverError', 1);
});

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection', reason);
  gracefulShutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception', error);
  gracefulShutdown('uncaughtException', 1);
});

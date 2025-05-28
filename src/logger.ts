import { createLogger, transports, format } from 'winston';

export const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`),
    format.errors()
  ),
  transports: [new transports.Console()],
});

export default logger;

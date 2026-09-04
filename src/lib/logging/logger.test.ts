/**
 * Tests for logging utility module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, createLogger, type LogLevel } from './logger';

describe('Logger', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Log Levels', () => {
    it('should support debug, info, warn, and error levels', () => {
      const logger = createLogger({ level: 'debug' });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should filter logs based on configured level', () => {
      const logger = createLogger({ level: 'warn' });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should use debug level in development environment', () => {
      const logger = createLogger({ environment: 'development' });
      expect(logger.getLevel()).toBe('debug');
    });

    it('should use info level in production environment', () => {
      const logger = createLogger({ environment: 'production' });
      expect(logger.getLevel()).toBe('info');
    });
  });

  describe('Log Entry Format', () => {
    it('should include timestamp in all log entries', () => {
      const logger = createLogger({ level: 'info' });
      logger.info('Test message');

      const logCall = consoleInfoSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);

      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it('should format log entries as JSON', () => {
      const logger = createLogger({ level: 'info' });
      logger.info('Test message', { key: 'value' });

      const logCall = consoleInfoSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);

      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('level', 'info');
      expect(logEntry).toHaveProperty('message', 'Test message');
      expect(logEntry).toHaveProperty('context');
      expect(logEntry.context).toEqual({ key: 'value' });
    });

    it('should include structured data in context', () => {
      const logger = createLogger({ level: 'error' });
      const context = {
        userId: '123',
        action: 'login',
        status: 'failed',
      };

      logger.error('Login failed', context);

      const logCall = consoleErrorSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);

      expect(logEntry.context).toEqual(context);
    });
  });

  describe('Configuration', () => {
    it('should allow changing log level dynamically', () => {
      const logger = createLogger({ level: 'error' });

      logger.info('Should not log');
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      logger.setLevel('info');
      logger.info('Should log');
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });

    it('should return current log level', () => {
      const logger = createLogger({ level: 'warn' });
      expect(logger.getLevel()).toBe('warn');
    });
  });

  describe('Edge Cases', () => {
    it('should handle logging without context', () => {
      const logger = createLogger({ level: 'info' });
      logger.info('Message without context');

      const logCall = consoleInfoSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);

      expect(logEntry.message).toBe('Message without context');
      expect(logEntry.context).toBeUndefined();
    });

    it('should handle empty context object', () => {
      const logger = createLogger({ level: 'info' });
      logger.info('Message with empty context', {});

      const logCall = consoleInfoSpy.mock.calls[0][0];
      const logEntry = JSON.parse(logCall);

      expect(logEntry.context).toEqual({});
    });
  });
});

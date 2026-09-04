import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { sanitizeForLogging } from './log-sanitizer';

export interface LogEntry {
  timestamp: string;
  level: string;
  context?: string;
  message: string;
  correlationId?: string;
  details?: unknown;
  stack?: string;
  [key: string]: unknown;
}

@Injectable()
export class StructuredLoggerService implements LoggerService {
  private isJsonMode =
    process.env.NODE_ENV === 'production' ||
    process.env.STRUCTURED_LOGGING === 'true';
  private logLevels = new Set<LogLevel>([
    'log',
    'error',
    'warn',
    'debug',
    'verbose',
  ]);

  setJsonMode(enabled: boolean) {
    this.isJsonMode = enabled;
  }

  setLogLevels(levels: LogLevel[]) {
    this.logLevels = new Set<LogLevel>(levels);
  }

  private formatEntry(
    level: string,
    message: unknown,
    context?: string,
    extra?: Record<string, unknown>,
    stack?: string,
  ): LogEntry {
    const timestamp = new Date().toISOString();
    let msgString = '';
    let details: unknown;

    if (typeof message === 'string') {
      msgString = message;
    } else if (message instanceof Error) {
      msgString = message.message;
      stack = stack || message.stack;
    } else if (typeof message === 'object' && message !== null) {
      const safeMessage = sanitizeForLogging(
        message as Record<string, unknown>,
      );
      if ('message' in safeMessage && safeMessage.message) {
        msgString =
          typeof safeMessage.message === 'string'
            ? safeMessage.message
            : JSON.stringify(safeMessage.message);
        const { message: _message, ...rest } = safeMessage;
        details = Object.keys(rest).length > 0 ? rest : undefined;
      } else {
        msgString = JSON.stringify(safeMessage);
      }
    } else {
      msgString = String(message);
    }

    const entry: LogEntry = {
      timestamp,
      level,
      context: context || 'Application',
      message: msgString,
    };

    const safeExtra = extra ? sanitizeForLogging(extra) : undefined;
    if (typeof safeExtra?.correlationId === 'string') {
      entry.correlationId = safeExtra.correlationId;
    }
    if (details !== undefined) {
      entry.details = details;
    }
    if (safeExtra && Object.keys(safeExtra).length > 0) {
      for (const [k, v] of Object.entries(safeExtra)) {
        if (k !== 'correlationId' && v !== undefined) {
          entry[k] = v;
        }
      }
    }
    if (stack) {
      entry.stack = stack;
    }

    return entry;
  }

  private output(entry: LogEntry) {
    if (this.isJsonMode) {
      const jsonLine = JSON.stringify(entry);
      if (entry.level === 'error') {
        process.stderr.write(`${jsonLine}\n`);
      } else {
        process.stdout.write(`${jsonLine}\n`);
      }
    } else {
      const cidTag = entry.correlationId ? ` [${entry.correlationId}]` : '';
      const ctxTag = entry.context ? ` [${entry.context}]` : '';
      const text = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${ctxTag}${cidTag} ${entry.message}`;
      if (entry.level === 'error') {
        process.stderr.write(`${text}\n`);
        if (entry.stack) {
          process.stderr.write(`${entry.stack}\n`);
        }
      } else if (entry.level === 'warn') {
        process.stderr.write(`${text}\n`);
      } else {
        process.stdout.write(`${text}\n`);
      }
    }
  }

  log(message: unknown, context?: string, extra?: Record<string, unknown>) {
    if (!this.logLevels.has('log')) return;
    const entry = this.formatEntry('info', message, context, extra);
    this.output(entry);
  }

  error(
    message: unknown,
    stackOrContext?: string,
    contextOrExtra?: string | Record<string, unknown>,
    extraParam?: Record<string, unknown>,
  ) {
    if (!this.logLevels.has('error')) return;
    let stack: string | undefined;
    let context: string | undefined;
    let extra: Record<string, unknown> | undefined;

    if (typeof stackOrContext === 'string' && stackOrContext.includes('\n')) {
      stack = stackOrContext;
      if (typeof contextOrExtra === 'string') {
        context = contextOrExtra;
        extra = extraParam;
      } else {
        extra = contextOrExtra;
      }
    } else {
      context = stackOrContext;
      extra = typeof contextOrExtra === 'object' ? contextOrExtra : extraParam;
    }

    const entry = this.formatEntry('error', message, context, extra, stack);
    this.output(entry);
  }

  warn(message: unknown, context?: string, extra?: Record<string, unknown>) {
    if (!this.logLevels.has('warn')) return;
    const entry = this.formatEntry('warn', message, context, extra);
    this.output(entry);
  }

  debug(message: unknown, context?: string, extra?: Record<string, unknown>) {
    if (!this.logLevels.has('debug')) return;
    const entry = this.formatEntry('debug', message, context, extra);
    this.output(entry);
  }

  verbose(message: unknown, context?: string, extra?: Record<string, unknown>) {
    if (!this.logLevels.has('verbose')) return;
    const entry = this.formatEntry('verbose', message, context, extra);
    this.output(entry);
  }
}

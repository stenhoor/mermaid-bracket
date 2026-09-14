/* Utilities Mermaid injects into an external diagram at load time (see DiagramDefinition.injectUtils). */

type LogFn = (...args: unknown[]) => void;
export interface MermaidLog {
  trace: LogFn;
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
}

const noop: LogFn = () => undefined;
export const log: MermaidLog = { trace: noop, debug: noop, info: noop, warn: noop, error: noop, fatal: noop };

export let getConfig: () => Record<string, unknown> = () => ({});
export let sanitizeText: (s: string) => string = (s) => s;

export function injectUtils(
  _log: MermaidLog,
  _setLogLevel: unknown,
  _getConfig: () => Record<string, unknown>,
  _sanitizeText: (s: string) => string,
): void {
  Object.assign(log, _log);
  getConfig = _getConfig;
  sanitizeText = _sanitizeText;
}

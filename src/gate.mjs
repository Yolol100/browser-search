import { SearchError } from './errors.mjs';

export class SerialCooldownGate {
  constructor(cooldownMs, maxQueue = 8) {
    this.cooldownMs = cooldownMs;
    this.maxQueue = maxQueue;
    this.tail = Promise.resolve();
    this.lastStart = 0;
    this.pending = 0;
  }

  run(task) {
    if (this.pending >= this.maxQueue) {
      throw new SearchError('QUEUE_FULL', 'Browser search queue is full. Retry later.', 429, { maxQueue: this.maxQueue });
    }
    this.pending += 1;
    const execute = async () => {
      const wait = Math.max(0, this.cooldownMs - (Date.now() - this.lastStart));
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      this.lastStart = Date.now();
      return task();
    };
    const next = this.tail.then(execute, execute);
    this.tail = next.catch(() => undefined);
    return next.finally(() => { this.pending -= 1; });
  }
}

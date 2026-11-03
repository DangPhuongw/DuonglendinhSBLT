export class EventQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  public enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const res = await task();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    this.isProcessing = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (err) {
        console.error('EventQueue processing error:', err);
      }
    }
    this.isProcessing = false;
    this.processNext();
  }

  public clear(): void {
    this.queue = [];
  }

  public get length(): number {
    return this.queue.length;
  }
}

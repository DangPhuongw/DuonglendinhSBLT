class BgmManager {
  public isEnabled: boolean = false;

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }

  public start() {
    // Disabled synthetic oscillator
  }

  public setUrgency(_urgent: boolean) {
    // Disabled
  }

  public stop() {
    // Disabled
  }
}

export const bgmManager = new BgmManager();

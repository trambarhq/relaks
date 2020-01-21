class AsyncRenderingInterrupted extends Error {
  constructor() {
    this.message = 'Async rendering interrupted';
  }
}

export {
  AsyncRenderingInterrupted,
};

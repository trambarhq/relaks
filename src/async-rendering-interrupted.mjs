class AsyncRenderingInterrupted extends Error {
  constructor() {
    super();
    this.message = 'Async rendering interrupted';
  }
}

export {
  AsyncRenderingInterrupted,
};

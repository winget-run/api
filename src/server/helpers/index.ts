const wait = (timeout: number): Promise<void> => new Promise(resolve => setTimeout(resolve, timeout));

const chunk = <T>(array: T[], size: number): T[][] => {
  const chunked = [];

  for (let i = 0; i < Math.ceil(array.length / Math.max(size, 1)); i += 1) {
    chunked.push(array.slice(i * size, Math.min(i * size + size, array.length)));
  }

  return chunked;
};

// TODO: add better error handling and allow to see which calls/batches failed

// anything set to unknown is a value we dont care about and well never use
// its more accurate than void as a value may exist, but we just dont care
const batch = async <T>(array: T[], batchSize: number, callbackFn: () => Promise<unknown>): Promise<void> => {
  const chunked = chunk(array, batchSize);

  // typescript complains due to the typings on the reduce fn and there is no way
  // to keep it happy even though the usage below is correct

  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  await chunked.reduce(async (p: Promise<unknown>, c: T[]) => {
    await p;

    return Promise.all(c.map(callbackFn));
  }, Promise.resolve());
};

// wait (timeout)
// chunk (array, chunkSize)
// batch (array, batchSize, callbackFn)

export {
  wait,
  chunk,
  batch,
};

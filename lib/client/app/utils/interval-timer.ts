export type Options = {
  readonly intervalInMs: number;
  readonly callback: () => Promise<void>;
};

export const createIntervalTimer = ({ intervalInMs, callback }: Options) => {
  let timerId: number | null = null;

  const start = () => {
    return timerId = window.setTimeout(async () => {
      await callback();
      if (timerId) {
        timerId = start();
      }
    }, intervalInMs);
  };

  return {
    start,

    stop: () => {
      if (!timerId) {
        return;
      }

      clearTimeout(timerId);
      timerId = null;
    },
  };
};



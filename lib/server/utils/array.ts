export const pushAndReturn = <T>(arr: T[], item: T): T => {
  arr.push(item);
  return item;
};

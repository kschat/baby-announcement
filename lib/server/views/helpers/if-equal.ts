import { HelperOptions } from 'handlebars';

export default function ifEqual (
  this: any, 
  a: any, 
  b: any, 
  options: HelperOptions,
): string {
  return a == b 
    ? options.fn(this) 
    : options.inverse(this);
};

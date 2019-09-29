import { HelperOptions } from 'handlebars';

export default function math (
  this: any, 
  l: string, 
  operator: string, 
  r: string,
  _options: HelperOptions,
): string {
  const lValue = parseFloat(l);
  const rValue = parseFloat(r);
  switch (operator) {
    case '+': return String(lValue + rValue);
    case '-': return String(lValue - rValue);
    case '*': return String(lValue * rValue);
    case '/': return String(lValue / rValue);
    case '%': return String(lValue % rValue);
    default: throw new Error('Operation not supported');
  }
};

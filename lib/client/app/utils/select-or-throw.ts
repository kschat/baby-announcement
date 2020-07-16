export function $<K extends keyof HTMLElementTagNameMap>(parent: ParentNode, selectors: K): HTMLElementTagNameMap[K];
export function $<K extends keyof SVGElementTagNameMap>(parent: ParentNode, selectors: K): SVGElementTagNameMap[K];
export function $<E extends Element = Element>(parent: ParentNode, selectors: string): E;
export function $<E extends Element = Element>(parent: ParentNode, selectors: string): E {
  const elementOrNull = parent.querySelector<E>(selectors);
  if (!elementOrNull) {
    throw new Error(`Could not find element with selector "${selectors}"`);
  }

  return elementOrNull;
};

export function $$<K extends keyof HTMLElementTagNameMap>(parent: ParentNode, selectors: K): Array<HTMLElementTagNameMap[K]>;
export function $$<K extends keyof SVGElementTagNameMap>(parent: ParentNode, selectors: K): Array<SVGElementTagNameMap[K]>;
export function $$<E extends Element = Element>(parent: ParentNode, selectors: string): E[];
export function $$<E extends Element = Element>(parent: ParentNode, selectors: string): E[] {
  const elements = parent.querySelectorAll<E>(selectors);
  if (!elements.length) {
    throw new Error(`Could not find elements with selector "${selectors}"`);
  }

  return Array.from(elements);
};


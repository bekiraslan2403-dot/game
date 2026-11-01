// React 19 kendi tip tanımlarıyla gelmez; bu ortamda @types/react kurulamadığı için
// projede kullanılan React yüzeyinin en küçük tip tanımı burada tutulur.
// Kendi bilgisayarında "npm install -D @types/react @types/react-dom" çalıştırıp bu dosyayı silebilirsin.

declare namespace React {
  type Key = string | number;
  type ReactNode = ReactElement | string | number | bigint | boolean | null | undefined | Iterable<ReactNode>;
  interface ReactElement {
    type: unknown;
    props: unknown;
    key: Key | null;
  }
  type SetStateAction<S> = S | ((onceki: S) => S);
  type Dispatch<A> = (deger: A) => void;
  interface RefObject<T> {
    current: T;
  }
  type FC<P = Record<string, never>> = (props: P) => ReactElement | null;
  interface PropsWithChildren {
    children?: ReactNode;
  }
  interface CSSProperties {
    [ozellik: string]: string | number | undefined;
  }
  interface SyntheticEvent<T = Element> {
    currentTarget: T;
    target: EventTarget;
    preventDefault(): void;
    stopPropagation(): void;
  }
  type MouseEvent<T = Element> = SyntheticEvent<T>;
  type KeyboardEvent<T = Element> = SyntheticEvent<T> & { key: string };
  type ChangeEvent<T = Element> = SyntheticEvent<T>;
}

declare module "react" {
  export = React;
  export as namespace React;
}
declare namespace React {
  function useState<S>(baslangic: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  function useReducer<S, A>(indirgeyici: (durum: S, eylem: A) => S, baslangic: S): [S, Dispatch<A>];
  function useEffect(etki: () => void | (() => void), bagimliliklar?: readonly unknown[]): void;
  function useLayoutEffect(etki: () => void | (() => void), bagimliliklar?: readonly unknown[]): void;
  function useMemo<T>(uret: () => T, bagimliliklar: readonly unknown[]): T;
  function useCallback<T extends (...args: never[]) => unknown>(fn: T, bagimliliklar: readonly unknown[]): T;
  function useRef<T>(baslangic: T): RefObject<T>;
  function useId(): string;
  const Fragment: unique symbol;
  const StrictMode: FC<PropsWithChildren>;
}

declare module "react/jsx-runtime" {
  export function jsx(tur: unknown, props: unknown, anahtar?: React.Key): React.ReactElement;
  export function jsxs(tur: unknown, props: unknown, anahtar?: React.Key): React.ReactElement;
  export const Fragment: unique symbol;
}

declare module "react-dom/client" {
  interface Kok {
    render(dugum: React.ReactNode): void;
    unmount(): void;
  }
  export function createRoot(kap: Element): Kok;
}

declare namespace JSX {
  type Element = React.ReactElement;
  interface ElementChildrenAttribute {
    children: object;
  }
  interface IntrinsicAttributes {
    key?: React.Key;
  }
  interface IntrinsicElements {
    [etiket: string]: Record<string, unknown> & { key?: React.Key; children?: React.ReactNode };
  }
}

declare module "*.css";

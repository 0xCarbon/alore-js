export interface PasswordRule {
  name: string;
  label: string;
  regex?: RegExp;
  key: string;
}

export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
};

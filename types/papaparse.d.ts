declare module "papaparse" {
    export interface ParseResult<T> {
      data: T[];
      errors: { message: string }[];
      meta: any;
    }
  
    export interface ParseConfig<T> {
      header?: boolean;
      skipEmptyLines?: boolean;
      complete?: (results: ParseResult<T>) => void;
    }
  
    export function parse<T>(file: File, config: ParseConfig<T>): void;
  }
  
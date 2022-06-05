export type TSetString = { (line: string): void };

export type TRunParams = {
  code: string;
  setResult: TSetString;
  setStdout: TSetString;
  setStderr: TSetString;
};

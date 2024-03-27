export type Entity = {
  id: string;
  name: string;
  fullPath: string;
  children?: Entity[];
}


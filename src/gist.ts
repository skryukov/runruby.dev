import { $gist } from "./stores/gists.ts";

const BASE_URL = "https://api.github.com/gists/";

export interface GistFile {
  filename: string;
  content: string;
}

export type Gist = {
  files: GistFile[];
  description: string;
  username: string;
  userId: number;
  avatarUrl: string;
}

export default async function importFromGist(gistUrl: string): Promise<Gist> {
  const id = gistUrl.split("/").pop();
  if (id === undefined) {
    throw new Error(`Gist id not found`);
  }

  const url = `${BASE_URL}${id}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Gist ${id} not found`);
  }

  const data = await response.json();

  if (!data.files) {
    throw new Error(`Gist has no files`);
  }

  const files: GistFile[] = Object.values(data.files);
  const res: Gist = {
    files: files.map((f): GistFile => ({...f, filename: f.filename.split("$$").join("/")})),
    description: data.description,
    username: data.owner.login,
    userId: data.owner.id,
    avatarUrl: data.owner.avatar_url
  };

  $gist.set({ id, ...res });

  return res;
}

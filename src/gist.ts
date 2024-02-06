const BASE_URL = "https://api.github.com/gists/";

export interface GistFile {
  filename: string;
  content: string;
}

export default async function importFromGist(gistUrl: string): Promise<{ files: GistFile[] }> {
  const id = gistUrl.split("/").pop();

  const url = `${BASE_URL}${id}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Gist ${id} not found`);
  }

  const data = await response.json();

  if (!data.files) {
    throw new Error(`Gist has no files`);
  }

  return { files: Object.values(data.files) };
}

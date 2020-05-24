// Generated by https://quicktype.io

/* eslint-disable camelcase */
export interface CommitDetails {
  sha: string;
  node_id: string;
  commit: Commit;
  url: string;
  html_url: string;
  comments_url: string;
  author: CommitDetailsAuthor;
  committer: CommitDetailsAuthor;
  parents: Parent[];
  stats: Stats;
  files: File[];
}

interface CommitDetailsAuthor {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

interface Commit {
  author: CommitAuthor;
  committer: CommitAuthor;
  message: string;
  tree: Tree;
  url: string;
  comment_count: number;
  verification: Verification;
}

interface CommitAuthor {
  name: string;
  email: string;
  date: string;
}

interface Tree {
  sha: string;
  url: string;
}

interface Verification {
  verified: boolean;
  reason: string;
  signature: string;
  payload: string;
}

export interface File {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch: string;
}

interface Parent {
  sha: string;
  url: string;
  html_url: string;
}

interface Stats {
  total: number;
  additions: number;
  deletions: number;
}

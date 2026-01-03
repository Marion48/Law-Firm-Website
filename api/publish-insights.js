import fetch from "node-fetch";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "marion48";
const REPO = "Law-Firm-Website";
const BRANCH = "main";
const FILE_PATH = "insights/data.json";

async function getFile() {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`
      }
    }
  );

  if (!res.ok) throw new Error("Failed to fetch file");
  return res.json();
}

async function updateFile(content, sha, message) {
  return fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
        sha,
        branch: BRANCH
      })
    }
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { action, insight, index } = req.body;

  try {
    const file = await getFile();
    const data = JSON.parse(Buffer.from(file.content, "base64").toString());

    if (action === "add") {
      data.unshift(insight);
    }

    if (action === "edit") {
      data[index] = insight;
    }

    if (action === "delete") {
      data.splice(index, 1);
    }

    await updateFile(data, file.sha, `${action} insight: ${insight?.title || "removed"}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

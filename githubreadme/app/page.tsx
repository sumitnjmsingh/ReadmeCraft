"use client";
import { useState } from "react";
import { Github, Loader2, FileDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [readme, setReadme] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<"raw" | "preview">("raw");

  const generateReadme = async () => {
    if (!repoUrl.trim()) return;
    setLoading(true);
    const res = await fetch("/api/generate-readme", {
      method: "POST",
      body: JSON.stringify({ repoUrl }),
    });
    const data = await res.json();
    setReadme(data.readme || data.error);
    setLoading(false);
  };

  const downloadReadme = () => {
    const blob = new Blob([readme], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "README.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-4 py-10">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12 transition-all duration-300">
        <div className="flex items-center space-x-3 mb-6">
          <Github className="w-7 h-7 text-gray-800" />
          <h1 className="text-3xl font-bold text-gray-900">
            GitHub README Generator
          </h1>
        </div>

        <p className="text-gray-600 mb-6">
          Paste any public GitHub repository URL and generate a professional
          README.md file using AI.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="e.g. https://github.com/vercel/next.js"
          />
          <button
            onClick={generateReadme}
            disabled={loading}
            className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-60 hover:cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              "Generate README"
            )}
          </button>
        </div>

        {readme && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                Generated README:
              </h2>
              <button
                onClick={downloadReadme}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 hover:cursor-pointer transition"
              >
                <FileDown className="w-4 h-4" />
                Download
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-[600px] whitespace-pre-wrap text-sm text-gray-800 font-mono shadow-inner">
              {/* <pre>{readme}</pre> */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setPreviewMode("raw")}
                  className={`px-4 py-1 rounded-md text-sm font-medium border ${
                    previewMode === "raw"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  Raw Markdown
                </button>
                <button
                  onClick={() => setPreviewMode("preview")}
                  className={`px-4 py-1 rounded-md text-sm font-medium border ${
                    previewMode === "preview"
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 border-gray-300"
                  }`}
                >
                  Preview
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto max-h-[600px] text-sm text-gray-800 font-mono shadow-inner whitespace-pre-wrap">
                {previewMode === "raw" ? (
                  <pre>{readme}</pre>
                ) : (
                  <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-left">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {readme}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

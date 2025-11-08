"use client";

import { useState, useEffect } from "react";

function normalizeURL(userInput: string): string {
  // Trim whitespace
  let url = userInput.trim();

  // Return empty string if input is empty
  if (!url) {
    return "";
  }

  // Check if the URL already has a protocol
  const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//i.test(url);

  // If no protocol, prepend https://
  if (!hasProtocol) {
    url = "https://" + url;
  }

  // Validate the URL structure
  try {
    const urlObject = new URL(url);
    return urlObject.href;
  } catch (error) {
    throw new Error("Invalid URL format");
  }
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [parodyHtml, setParodyHtml] = useState("");
  const [error, setError] = useState("");

  const isRunningLocally = process.env.NODE_ENV === "development";

  // Load cached data on mount
  useEffect(() => {
    const cachedUrl = localStorage.getItem("parodyUrl");
    const cachedHtml = localStorage.getItem("parodyHtml");

    if (cachedUrl && cachedHtml) {
      setUrl(cachedUrl);
      setParodyHtml(cachedHtml);
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setParodyHtml("");

    try {
      let endpoint = isRunningLocally
        ? "http://127.0.0.1:8000/api/parody"
        : "https://projects.panickssery.com/api/parody";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizeURL(url) }),
      });
      if (!res.ok) {
        throw new Error("Failed to scrape website");
      }
      const { parody_html } = await res.json();
      setParodyHtml(parody_html);

      // Cache the URL and HTML
      localStorage.setItem("parodyUrl", url);
      localStorage.setItem("parodyHtml", parody_html);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <h1 className="sm:text-lg py-1 px-2">website parody generator</h1>
      <div className="flex gap-2 px-2 pb-2 border-b">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL (e.g. https://example.com)"
          className="text-xs sm:text-base px-2 py-1 border flex-1"
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !url}
          className="text-xs sm:text-base bg-pink-600 text-white px-2 py-1 hover:bg-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "workin'..." : "generate"}
        </button>
        {parodyHtml && (
          <button
            onClick={() => {
              const blob = new Blob([parodyHtml], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "parody.html";
              a.click();
            }}
            className="text-xs sm:text-base  bg-green-600 text-white px-2 py-1 hover:bg-green-700 disabled:opacity-50 cursor-pointer"
          >
            download html
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs sm:text-base text-red-600 p-2">{error}</div>
      )}

      {parodyHtml && (
        <div className="relative">
          <iframe
            srcDoc={parodyHtml}
            className="w-full h-svh"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}

      {!parodyHtml && !error && (
        <div className="p-2 text-xs sm:text-base text-gray-500">
          {loading
            ? "🔨 working on your site... (this might take a few minutes)"
            : 'enter a url and click "generate" to create a parody'}
        </div>
      )}
    </div>
  );
}

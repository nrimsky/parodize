"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [parodyHtml, setParodyHtml] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setParodyHtml("");

    try {
      // Step 1: Scrape website
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!scrapeRes.ok) {
        throw new Error("Failed to scrape website");
      }

      const { data: styleData } = await scrapeRes.json();

      // Step 2: Generate parody
      const parodyRes = await fetch("/api/generate-parody", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ styleData }),
      });

      if (!parodyRes.ok) {
        throw new Error("Failed to generate parody");
      }

      const { html } = await parodyRes.json();
      // if html starts with ```html and ends with ```, remove those
      const cleanedHtml = html
        .replace(/^```html/, "")
        .replace(/```$/, "")
        .trim();
      setParodyHtml(cleanedHtml);
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
          {loading ? "thinkin'..." : "generate"}
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
            sandbox="allow-same-origin"
          />
        </div>
      )}

      {!parodyHtml && !error && (
        <div className="p-2 text-xs sm:text-base text-gray-500">
          enter a url and click "generate" to create a parody
        </div>
      )}
    </div>
  );
}

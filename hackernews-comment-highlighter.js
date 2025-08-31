// ==UserScript==
// @name         Hacker News Comment Highlighter
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Highlights stories on the Hacker News front page with different colors based on comment count.
// @author       Gemini
// @match        https://news.ycombinator.com/*
// @grant        none
// @homepage     https://github.com/adhikasp/tampermonkey-collections
// ==/UserScript==

(function() {
    'use strict';

    // --- Configuration: Define thresholds and corresponding highlight colors ---
    // The colors are chosen to create a smooth, intuitive gradient from popular to very popular.
    const THRESHOLDS = [
        { count: 1000, color: 'rgba(255, 99, 71, 0.3)' },   // Strong Red-Orange for > 1000 comments
        { count: 500,  color: 'rgba(255, 165, 0, 0.25)' },  // Warm Orange for > 500 comments
        { count: 100,  color: 'rgba(255, 215, 0, 0.25)' },  // Gold for > 100 comments
        { count: 50,   color: 'rgba(255, 250, 205, 0.5)' }   // Lemon Chiffon (Light Yellow) for > 50 comments
    ];


    /**
     * Main function to find and highlight stories.
     */
    function highlightHotStories() {
        // Hacker News stories are in `<tr>` elements with the class "athing".
        const storyElements = document.querySelectorAll('tr.athing');

        storyElements.forEach(storyRow => {
            // The metadata (score, comments, etc.) is in the immediately following `<tr>`.
            const metadataRow = storyRow.nextElementSibling;

            if (!metadataRow) {
                return; // Skip if the metadata row doesn't exist for some reason.
            }

            // The comment link is the last `<a>` tag in the subtext cell.
            const links = metadataRow.querySelectorAll('.subtext a');
            const commentLink = links.length > 0 ? links[links.length - 1] : null;

            if (commentLink && commentLink.href.includes('item?id=')) {
                const commentText = commentLink.textContent; // e.g., "150&nbsp;comments" or "discuss"

                if (commentText.includes('comment')) {
                    // Use a regular expression to extract the numerical part of the string.
                    const match = commentText.match(/(\d+)/);

                    if (match) {
                        const commentCount = parseInt(match[1], 10);
                        let highlightColor = null;

                        // Find the appropriate color based on the comment count.
                        // The thresholds are checked from highest to lowest.
                        for (const threshold of THRESHOLDS) {
                            if (commentCount > threshold.count) {
                                highlightColor = threshold.color;
                                break; // Stop at the first threshold that is met
                            }
                        }

                        // If a highlight color was determined, apply it.
                        if (highlightColor) {
                            storyRow.style.backgroundColor = highlightColor;
                            metadataRow.style.backgroundColor = highlightColor;
                        }
                    }
                }
            }
        });
    }

    // Run the script once the page content is fully loaded.
    window.addEventListener('load', highlightHotStories);

})();

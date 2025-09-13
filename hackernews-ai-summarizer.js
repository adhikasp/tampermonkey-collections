// ==UserScript==
// @name         Hacker News AI Summarizer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automatically summarizes Hacker News posts and comments using OpenRouter API
// @author       You
// @match        https://news.ycombinator.com/*
// @connect      openrouter.ai
// @connect      github.com
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    // Configuration - You'll need to set your OpenRouter API key
    const OPENROUTER_API_KEY = GM_getValue('openrouter_api_key', '');
    const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
    const MODEL = 'openai/gpt-5-mini';

    // Add settings button to navbar
    addSettingsButton();

    // Only run summarizer on item pages if API key is configured
    const isItemPage = window.location.pathname.startsWith('/item');
    if (isItemPage && OPENROUTER_API_KEY) {
        runSummarizer();
    } else if (isItemPage && !OPENROUTER_API_KEY) {
        showSetupMessage();
    }

    // Add settings button to Hacker News navbar
    function addSettingsButton() {
        const pagetop = document.querySelector('.pagetop');
        if (!pagetop) return;

        const settingsLink = document.createElement('a');
        settingsLink.href = '#';
        settingsLink.textContent = 'AI Settings';
        settingsLink.style.cssText = 'margin-left: 10px; color: #ff6600; text-decoration: none;';
        settingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSettingsModal();
        });

        pagetop.appendChild(settingsLink);
    }

    // Show settings modal
    function showSettingsModal() {
        // Remove existing modal if present
        const existingModal = document.getElementById('hn-ai-settings-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'hn-ai-settings-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        const currentApiKey = GM_getValue('openrouter_api_key', '');

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                max-width: 500px;
                width: 90%;
                font-family: Arial, sans-serif;
            ">
                <h3 style="margin-top: 0; color: #ff6600;">Hacker News AI Summarizer Settings</h3>

                <div style="margin-bottom: 15px;">
                    <label for="api-key-input" style="display: block; margin-bottom: 5px; font-weight: bold;">
                        OpenRouter API Key:
                    </label>
                    <input
                        type="password"
                        id="api-key-input"
                        value="${currentApiKey}"
                        placeholder="Enter your OpenRouter API key"
                        style="
                            width: 100%;
                            padding: 8px;
                            border: 1px solid #ccc;
                            border-radius: 4px;
                            font-family: monospace;
                            box-sizing: border-box;
                        "
                    >
                </div>

                <div style="margin-bottom: 15px; font-size: 14px; color: #666;">
                    Get your API key from <a href="https://openrouter.ai/keys" target="_blank" style="color: #007bff;">OpenRouter</a>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancel-btn" style="
                        padding: 8px 16px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Cancel</button>
                    <button id="save-btn" style="
                        padding: 8px 16px;
                        background: #ff6600;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Focus on input
        setTimeout(() => {
            document.getElementById('api-key-input').focus();
        }, 100);

        // Event listeners
        document.getElementById('cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('save-btn').addEventListener('click', () => {
            const apiKey = document.getElementById('api-key-input').value.trim();
            if (apiKey) {
                GM_setValue('openrouter_api_key', apiKey);
                showSuccessMessage('API key saved successfully!');
                modal.remove();

                // If on an item page, run the summarizer
                if (window.location.pathname.startsWith('/item')) {
                    location.reload();
                }
            } else {
                alert('Please enter a valid API key.');
            }
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function closeModal(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeModal);
            }
        });
    }

    // Show success message
    function showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 10px 15px;
            border: 1px solid #c3e6cb;
            border-radius: 4px;
            z-index: 10002;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }

    // Extract post content and comments
    function extractContent() {
        const postTitle = document.querySelector('.titleline a')?.textContent || '';
        const postText = document.querySelector('.toptext')?.textContent || '';
        const linkedUrl = document.querySelector('.titleline a')?.href || '';
        const comments = Array.from(document.querySelectorAll('.comment .commtext'))
            .map(comment => comment.textContent)
            .slice(0, 10); // Limit to first 10 comments

        return {
            title: postTitle,
            text: postText,
            comments: comments,
            url: window.location.href,
            linkedUrl: linkedUrl
        };
    }

    // Fetch and extract readable content from linked site
    function fetchLinkedContent(url) {
        return new Promise((resolve, reject) => {
            if (!url || url.startsWith('javascript:') || url === '#') {
                resolve(null);
                return;
            }

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000, // 10 second timeout
                onload: function(response) {
                    try {
                        if (response.status >= 200 && response.status < 300) {
                            const content = extractReadableContent(response.responseText, url);
                            resolve(content);
                        } else {
                            resolve(null); // Don't reject for HTTP errors, just return null
                        }
                    } catch (e) {
                        resolve(null);
                    }
                },
                onerror: function() {
                    resolve(null); // Don't reject on network errors, just return null
                },
                ontimeout: function() {
                    resolve(null); // Don't reject on timeout, just return null
                }
            });
        });
    }

    // Extract readable content from HTML
    function extractReadableContent(html, url) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Remove script and style elements
            const scripts = doc.querySelectorAll('script, style, nav, header, footer, aside, .ads, .advertisement, .sidebar');
            scripts.forEach(element => element.remove());

            // Try to find main content areas
            const contentSelectors = [
                'main',
                'article',
                '[role="main"]',
                '.content',
                '.post-content',
                '.entry-content',
                '.article-content',
                '.story-content',
                '#content',
                '#main',
                '.main-content'
            ];

            let contentElement = null;
            for (const selector of contentSelectors) {
                contentElement = doc.querySelector(selector);
                if (contentElement) break;
            }

            // Fallback to body if no specific content area found
            if (!contentElement) {
                contentElement = doc.body;
            }

            if (!contentElement) {
                return null;
            }

            // Extract text content and clean it up
            let text = contentElement.textContent || '';

            // Clean up whitespace and normalize
            text = text.replace(/\s+/g, ' ').trim();

            // Limit content length to prevent overly long prompts
            if (text.length > 5000) {
                text = text.substring(0, 5000) + '...';
            }

            return text.length > 100 ? text : null; // Only return if we have meaningful content

        } catch (e) {
            return null;
        }
    }

    // Create summary prompt
    function createPrompt(content, linkedContent = null) {
        let prompt = `Title: ${content.title}\n\n`;
        if (content.text) {
            prompt += `Post content: ${content.text}\n\n`;
        }
        if (linkedContent) {
            prompt += `Linked article content:\n${linkedContent}\n\n`;
        }
        if (content.comments.length > 0) {
            prompt += `Top comments:\n`;
            content.comments.forEach((comment, i) => {
                prompt += `${i + 1}. ${comment}\n`;
            });
        }

        return prompt;
    }

    // Send request to OpenRouter
    function getSummary(prompt) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: OPENROUTER_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Hacker News AI Summarizer'
                },
                data: JSON.stringify({
                    model: MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that summarizes Hacker News posts and comments. Please provide a concise summary covering the main points of the post and key insights from the discussion. The response should be in readable, easy to digest HTML format.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                }),
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.choices && data.choices[0]) {
                            resolve(data.choices[0].message.content);
                        } else {
                            reject(new Error('Invalid API response'));
                        }
                    } catch (e) {
                        reject(new Error('Failed to parse API response'));
                    }
                },
                onerror: function(error) {
                    reject(new Error('Network error: ' + error.statusText));
                }
            });
        });
    }

    // Show loading indicator while processing
    function showLoadingIndicator() {
        // Find the add comment form
        const commentForm = document.querySelector('form[action="comment"]') ||
                           document.querySelector('form[method="post"]') ||
                           document.querySelector('.comment-form');

        // Find the container that holds comments
        const commentsContainer = document.querySelector('.comments') ||
                                 document.querySelector('#comments') ||
                                 document.querySelector('.comment-tree');

        // Determine where to insert the loading indicator
        let insertAfter = null;
        if (commentForm) {
            // Insert after the comment form
            insertAfter = commentForm;
        } else if (commentsContainer) {
            // Insert before the comments container
            insertAfter = commentsContainer.previousElementSibling || commentsContainer.parentElement;
        }

        if (!insertAfter) {
            // Fallback: insert before the first comment
            const firstComment = document.querySelector('.comment') || document.querySelector('.athing');
            if (firstComment) {
                insertAfter = firstComment.previousElementSibling || firstComment.parentElement;
            }
        }

        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'hn-ai-loading';
        loadingDiv.style.cssText = `
            background: #f6f6ef;
            border: 1px solid #ff6600;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        loadingDiv.innerHTML = `
            <div style="
                width: 16px;
                height: 16px;
                border: 2px solid #ff6600;
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: hn-spin 1s linear infinite;
            "></div>
            <span style="color: #ff6600; font-weight: bold;">AI is analyzing content and generating summary...</span>
        `;

        // Add spinner animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes hn-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        // Insert the loading indicator in the appropriate location
        if (insertAfter && insertAfter.parentNode) {
            insertAfter.parentNode.insertBefore(loadingDiv, insertAfter.nextSibling);
        } else {
            // Fallback: append to body as before
            document.body.appendChild(loadingDiv);
        }

        return loadingDiv;
    }

    // Hide loading indicator
    function hideLoadingIndicator() {
        const loadingDiv = document.getElementById('hn-ai-loading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // Display summary on the page
    function displaySummary(summary) {
        // Find the add comment form
        const commentForm = document.querySelector('form[action="comment"]') ||
                           document.querySelector('form[method="post"]') ||
                           document.querySelector('.comment-form');

        // Find the container that holds comments
        const commentsContainer = document.querySelector('.comments') ||
                                 document.querySelector('#comments') ||
                                 document.querySelector('.comment-tree');

        // Determine where to insert the summary
        let insertAfter = null;
        if (commentForm) {
            // Insert after the comment form
            insertAfter = commentForm;
        } else if (commentsContainer) {
            // Insert before the comments container
            insertAfter = commentsContainer.previousElementSibling || commentsContainer.parentElement;
        }

        if (!insertAfter) {
            // Fallback: insert before the first comment
            const firstComment = document.querySelector('.comment') || document.querySelector('.athing');
            if (firstComment) {
                insertAfter = firstComment.previousElementSibling || firstComment.parentElement;
            }
        }

        const summaryDiv = document.createElement('div');
        summaryDiv.id = 'hn-ai-summary';
        summaryDiv.style.cssText = `
            background: #f6f6ef;
            border: 1px solid #ff6600;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;

        summaryDiv.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #ff6600; display: flex; justify-content: space-between; align-items: center;">
                AI Summary
                <button id="close-summary" style="background: none; border: none; color: #666; cursor: pointer; font-size: 18px; padding: 0;">×</button>
            </div>
            <div>
                ${summary}
            </div>
        `;

        // Insert the summary in the appropriate location
        if (insertAfter && insertAfter.parentNode) {
            insertAfter.parentNode.insertBefore(summaryDiv, insertAfter.nextSibling);
        } else {
            // Fallback: append to body as before
            document.body.appendChild(summaryDiv);
        }

        // Add close button functionality
        document.getElementById('close-summary').addEventListener('click', () => {
            summaryDiv.remove();
        });
    }

    // Show setup message if API key is not configured
    function showSetupMessage() {
        const setupDiv = document.createElement('div');
        setupDiv.id = 'hn-setup-message';
        setupDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: #fff3cd;
            border: 2px solid #ffecb5;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;

        setupDiv.innerHTML = `
            <div style="font-weight: bold; color: #856404; margin-bottom: 10px;">Hacker News AI Summarizer Setup Required</div>
            <div style="margin-bottom: 10px;">
                To use this script, you need to set your OpenRouter API key. Click the "AI Settings" link in the navbar above.
            </div>
            <div>
                Get your API key from <a href="https://openrouter.ai/keys" target="_blank" style="color: #007bff;">OpenRouter</a>
            </div>
        `;

        document.body.appendChild(setupDiv);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (setupDiv.parentNode) {
                setupDiv.remove();
            }
        }, 10000);
    }

    // Main function
    function runSummarizer() {
        // Wait a bit for the page to load
        setTimeout(async () => {
            try {
                // Show loading indicator
                showLoadingIndicator();

                const content = extractContent();

                // Fetch linked content if available
                let linkedContent = null;
                if (content.linkedUrl) {
                    try {
                        linkedContent = await fetchLinkedContent(content.linkedUrl);
                    } catch (e) {
                        console.log('Could not fetch linked content:', e.message);
                    }
                }

                const prompt = createPrompt(content, linkedContent);
                const summary = await getSummary(prompt);

                // Hide loading and show summary
                hideLoadingIndicator();
                displaySummary(summary);
            } catch (error) {
                console.error('Hacker News AI Summarizer error:', error);
                hideLoadingIndicator();
                displaySummary(`Error generating summary: ${error.message}`);
            }
        }, 2000);
    }

})();

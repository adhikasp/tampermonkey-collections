# adhikasp's Tampermonkey Scripts Collection

This is my personal collection of Tampermonkey scripts that enhance various websites with additional functionality and features.

## Installation

1. **Install Tampermonkey Extension**
   - For Chrome: [Tampermonkey on Chrome Web Store](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - For Firefox: [Tampermonkey on Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

2. **Install Scripts**
   - Click on any script file in this repository
   - Copy the entire script content
   - Open Tampermonkey dashboard in your browser
   - Create a new script and paste the content
   - Save the script

3. **Enable Scripts**
   - Make sure the scripts are enabled in Tampermonkey
   - Visit the target websites (HackerNews, etc.) to see the enhancements

## Scripts

### HackerNews AI Summarizer (`hackernews-ai-summarizer.js`)

Automatically summarizes Hacker News posts and comments using OpenRouter API, now enhanced to include content from linked articles.

**Features:**
- **AI-Powered Summarization**: Uses OpenRouter API to generate comprehensive summaries
- **Linked Article Analysis**: Fetches and analyzes content from the linked website for more complete summaries
- **Comment Integration**: Includes top comments in the analysis for better context
- **Settings Management**: Easy API key configuration through the browser interface
- **Smart Content Extraction**: Automatically extracts readable content from linked sites
- **Error Handling**: Gracefully handles cases where linked content cannot be fetched

**Setup:**
1. Get your OpenRouter API key from [OpenRouter](https://openrouter.ai/keys)
2. Visit any HackerNews item page
3. Click "AI Settings" in the navbar to configure your API key
4. The script will automatically generate summaries for new posts

**How it works:**
- Extracts post title, description, and top comments from HackerNews
- Fetches the linked article content (when available)
- Sends all content to OpenRouter API for analysis
- Displays a comprehensive AI-generated summary on the page

## Usage

Each script is designed to work automatically once installed. Visit the respective websites to experience the enhanced functionality.

## Contributing

This is a personal collection, but feel free to:
- Report issues or bugs
- Suggest improvements
- Fork and modify scripts for your own use

## License

These scripts are provided as-is for personal use. Please respect the terms of service of the websites you're enhancing.

---

*Created and maintained by adhikasp*

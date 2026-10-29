# IlmDost AI Chatbot - Netlify Edition

Converted from your uploaded Flask `app.py` and original `index.html`.
Your HTML/CSS layout, New chat button, system instructions, model, and last five chat exchanges are retained.

## Project structure

```
IlmDost_Netlify_Complete/
  public/index.html            # Original UI, adjusted to use the function URL
  netlify/functions/chat.mjs    # Secure Groq AI backend (JavaScript)
  netlify.toml                  # Tells Netlify what to publish
  .gitignore                   # Prevents uploading keys and temporary files
  README.md                    # This guide
```

The Python `app.py` is **not** needed for this Netlify version. There is **no** `requirements.txt` and you do **not** put a Groq key into your HTML.

## Recommended deployment: GitHub + Netlify (reliable for Functions)

1. **Extract this ZIP**. Do not upload the ZIP file into a GitHub repository as a single file; upload its *contents* and preserve folders.
2. On GitHub, create a new repository (Private is fine). Use **Add file > Upload files** to upload `netlify.toml`, `public/index.html`, `netlify/functions/chat.mjs`, etc. Make sure the file paths match the project structure above. Commit changes.
3. In Netlify, select **Add new project > Import an existing project**, choose GitHub, and select the repository.
4. Netlify should read `netlify.toml`. If it asks, set **Publish directory = `public`**; leave **Build command** empty (no build required). Choose the free plan if available.
5. In your new Netlify project, open **Project configuration > Environment variables > Add a variable**:
   - **Key:** `GROQ_API_KEY`
   - **Value:** your Groq API key from your Groq account
   - **Scopes:** All, or Functions if available
   - Do not include surrounding quotes.
6. Trigger a new deploy if you added the key after the first deploy (Netlify: **Deploys > Trigger deploy > Deploy project** or **Deploy site**, depending on the UI).
7. Open your `.netlify.app` address and send a question (for example, "What is photosynthesis?"). The UI posts to `/.netlify/functions/chat` on the same domain.

**Important:** Netlify Drop may publish HTML but not reliably build/deploy the serverless function. Use Git-connected deployment or the Netlify CLI for the complete chatbot. The function is essential for live AI responses.

## Alternative: deploy without GitHub using Netlify CLI

Install Node.js, then open a terminal inside the extracted folder:

```
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

If asked, choose your existing Netlify project or create one. Set `GROQ_API_KEY` in the Netlify UI and redeploy.

## Debugging

- **Page not found (404):** Confirm `public/index.html` exists, `netlify.toml` is in the top folder, and Publish directory is `public`.
- **Chat function returns 404:** The deploy did not include `netlify/functions/chat.mjs`. Use Git or Netlify CLI and check the **Functions** page in Netlify.
- **"not configured yet":** Add `GROQ_API_KEY` on Netlify and redeploy.
- **"API key was rejected":** Check Groq key status and spelling in Netlify settings.
- **AI usage limit:** Wait or check your Groq account limits.
- **Works opening as a local file, but chat fails:** You must deploy (or use `netlify dev`); functions do not run by double-clicking `index.html`.

## Security note

You previously uploaded a `.env` in the conversation. If it held a live key, rotate that key using Groq's API key management and use the new key in Netlify. Never put the key into HTML, JavaScript delivered to browsers, GitHub, or screenshots.

## One important note

This matches the original app's chat history handling (memory only in the current open browser tab). It doesn't add logins, user accounts, a database, or persistent chat storage. A publicly accessible AI endpoint can be abused and consume your Groq quota; consider rate limiting / authentication before sharing publicly.

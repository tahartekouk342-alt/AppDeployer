# GitHub Webhook Setup Guide

## Webhook URL

After deployment, your webhook endpoint is:

```
https://bfladigyrsaisybpbfla.backend.onspace.ai/functions/v1/github-webhook
```

## How to Configure in GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Webhooks** → **Add webhook**
3. Set **Payload URL** to the endpoint above
4. Set **Content type** to `application/json`
5. Select **Just the push event**
6. Click **Add webhook**

## What It Does

When a push event is received:
1. Finds all AppDeployer projects linked to the repository (`github_repo` field)
2. Updates their status to `building` 
3. Creates a "Build Started" notification in the Navbar panel
4. After 10 seconds (simulated build time), marks projects as `live`
5. Creates a "Build Complete" success notification

## Linking a Project to a GitHub Repo

In the GitHub page of AppDeployer, enter the repo in format `owner/repo-name`
(e.g. `ahmed/my-app`). The webhook will match on full name or repo name.

## Security Note

For production, add webhook secret verification:
- Set a secret in GitHub webhook settings
- Verify `X-Hub-Signature-256` header in the Edge Function

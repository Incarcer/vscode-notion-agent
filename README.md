# Notion Workspace Agent

A VSCode extension that registers a `@roadmap` chat participant to query your Notion workspace without consuming Cursor tokens.

## Problem

Every Cursor interaction loads 85k+ tokens of context, costing $0.17 per query for simple questions like "what's P0 today?"

## Solution

Offload planning queries to Notion AI (free, unlimited) - **$40-60/month savings at scale**

## Features

- `@roadmap` chat participant in VSCode/Cursor
- Query roadmap tasks by priority, focus, status
- Search Notion workspace pages
- Update task status
- Zero Cursor token usage

## Installation

### 1. Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Name: "VSCode Agent"
4. Select your workspace
5. Copy the **Internal Integration Token**

### 2. Share Database with Integration

1. Open your roadmap database in Notion
2. Click **"•••"** → **"Add connections"**
3. Select **"VSCode Agent"**

### 3. Get Database ID

From database URL: `notion.so/[workspace]/[DATABASE_ID]?v=...`

### 4. Configure Extension

In VSCode/Cursor:

1. Settings → Extensions → Notion Agent
2. Set **Notion Token**: `secret_xxx`
3. Set **Roadmap Database ID**: `[DATABASE_ID]`

## Usage

```
@roadmap what's P0 today?
@roadmap /tasks p0 today
@roadmap /search NBA implementation
@roadmap /update CVHC-439 to Done
@roadmap find all rate limiting code
@roadmap what tasks are overdue?
```

## Development

```bash
npm install
npm run compile
npm run watch
```

## Publishing

```bash
npm install -g vsce
vsce package
vsce publish
```

## Architecture

```
VSCode Chat
  └─> @roadmap participant
      └─> Notion API Client
          ├─> Notion AI (Q&A, search)
          ├─> Notion Database API (tasks, updates)
          └─> VSCode Workspace API (file search)
```

## Token Comparison

### Current (Cursor)
- Query: 85k tokens
- Cost: ~$0.17
- Total: 85.5k tokens

### With @roadmap
- Query: 0 Cursor tokens
- Cost: $0
- Savings: **$40-60/month**

import * as vscode from 'vscode';
import { NotionClient } from './notionClient';

export function activate(context: vscode.ExtensionContext) {
  // Register chat participant
  const participant = vscode.chat.createChatParticipant(
    'notion-agent.roadmap',
    async (request, context, stream, token) => {
      try {
        const notionClient = new NotionClient();

        // Show thinking indicator
        stream.progress('Querying Notion workspace...');

        // Handle different commands
        if (request.command === 'tasks') {
          await handleTasksCommand(notionClient, request, stream);
        } else if (request.command === 'search') {
          await handleSearchCommand(notionClient, request, stream);
        } else if (request.command === 'update') {
          await handleUpdateCommand(notionClient, request, stream);
        } else {
          // Default: Ask AI
          const response = await notionClient.askAI(request.prompt);
          stream.markdown(response);
        }

        // Add references
        stream.reference(vscode.Uri.parse('https://notion.so'));

      } catch (error: any) {
        stream.markdown(`❌ Error: ${error.message}\n\nMake sure you've configured your Notion token in settings.`);
      }

      return { metadata: { command: request.command } };
    }
  );

  context.subscriptions.push(participant);
}

// Command handlers

async function handleTasksCommand(
  client: NotionClient,
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream
) {
  const prompt = request.prompt.toLowerCase();

  let filter: any = {};

  if (prompt.includes('p0')) filter.priority = 'P0';
  if (prompt.includes('p1')) filter.priority = 'P1';
  if (prompt.includes('today')) filter.focus = 'Today';
  if (prompt.includes('next')) filter.focus = 'Next 3';

  const tasks = await client.getTasks(filter);
  const response = (client as any).formatTaskList(tasks, 'Filtered tasks');
  stream.markdown(response);
}

async function handleSearchCommand(
  client: NotionClient,
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream
) {
  const results = await client.search(request.prompt);
  const response = (client as any).formatSearchResults(results);
  stream.markdown(response);
}

async function handleUpdateCommand(
  client: NotionClient,
  request: vscode.ChatRequest,
  stream: vscode.ChatResponseStream
) {
  // Parse: "update CVHC-123 to Done"
  const match = request.prompt.match(/update ([A-Z]+-\d+) to ([A-Za-z ]+)/i);

  if (!match) {
    stream.markdown('❌ Format: `update CVHC-123 to Done`');
    return;
  }

  const [, taskId, status] = match;
  await client.updateTask(taskId, { status });
  stream.markdown(`✅ Updated ${taskId} to ${status}`);
}

export function deactivate() {}

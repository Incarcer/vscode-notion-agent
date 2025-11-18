import { Client } from '@notionhq/client';
import * as vscode from 'vscode';

export class NotionClient {
  private client: Client;
  private roadmapDbId: string;

  constructor() {
    const config = vscode.workspace.getConfiguration('notionAgent');
    const token = config.get<string>('token');
    this.roadmapDbId = config.get<string>('roadmapDatabaseId') || '';

    if (!token) {
      throw new Error('Notion token not configured');
    }

    this.client = new Client({ auth: token });
  }

  // Query roadmap tasks
  async getTasks(filter?: {
    priority?: 'P0' | 'P1' | 'P2';
    focus?: 'Today' | 'Next 3' | 'Backlog';
    status?: string;
  }): Promise<any[]> {
    const filterConditions: any = { and: [] };

    if (filter?.priority) {
      filterConditions.and.push({
        property: 'Priority',
        select: { equals: filter.priority }
      });
    }

    if (filter?.focus) {
      filterConditions.and.push({
        property: 'Focus',
        select: { equals: filter.focus }
      });
    }

    if (filter?.status) {
      filterConditions.and.push({
        property: 'Status',
        status: { equals: filter.status }
      });
    }

    const response = await (this.client as any).databases.query({
      database_id: this.roadmapDbId,
      filter: filterConditions.and.length > 0 ? filterConditions : undefined,
      sorts: [
        { property: 'Priority', direction: 'ascending' },
        { property: 'Deadline', direction: 'ascending' }
      ]
    });

    return response.results;
  }

  // Search workspace
  async search(query: string): Promise<any[]> {
    const response = await this.client.search({
      query,
      filter: { property: 'object', value: 'page' },
      page_size: 10
    });

    return response.results;
  }

  // Update task
  async updateTask(taskId: string, updates: {
    status?: string;
    notes?: string;
  }): Promise<void> {
    const properties: any = {};

    if (updates.status) {
      properties.Status = { status: { name: updates.status } };
    }

    if (updates.notes) {
      properties.Notes = {
        rich_text: [{ text: { content: updates.notes } }]
      };
    }

    await this.client.pages.update({
      page_id: taskId,
      properties
    });
  }

  // Ask Notion AI (uses your Notion AI quota)
  async askAI(question: string, context?: string): Promise<string> {
    // Note: This would use Notion's AI API if/when available
    // For now, we can construct responses from queried data

    // Simple keyword matching for MVP
    if (question.toLowerCase().includes('p0')) {
      const tasks = await this.getTasks({ priority: 'P0', focus: 'Today' });
      return this.formatTaskList(tasks, 'P0 tasks for today');
    }

    if (question.toLowerCase().includes('overdue')) {
      // Query overdue tasks
      const tasks = await this.getTasks({ status: 'Not started' });
      const overdue = tasks.filter((t: any) => {
        const deadline = t.properties?.Deadline?.date?.start;
        return deadline && new Date(deadline) < new Date();
      });
      return this.formatTaskList(overdue, 'Overdue tasks');
    }

    // Fallback to search
    const results = await this.search(question);
    return this.formatSearchResults(results);
  }

  private formatTaskList(tasks: any[], title: string): string {
    if (tasks.length === 0) {
      return `No ${title.toLowerCase()} found.`;
    }

    let result = `## ${title}\n\n`;
    for (const task of tasks) {
      const props = task.properties;
      const name = props.Task?.title?.[0]?.plain_text || 'Untitled';
      const priority = props.Priority?.select?.name || '?';
      const effort = props.Effort?.select?.name || '?';
      const status = props.Status?.status?.name || 'Unknown';

      result += `- **${name}** (${priority}, ${effort}) - ${status}\n`;
    }

    return result;
  }

  private formatSearchResults(results: any[]): string {
    if (results.length === 0) {
      return 'No results found.';
    }

    let output = '## Search Results\n\n';
    for (const result of results) {
      const title = (result as any).properties?.title?.title?.[0]?.plain_text ||
                   (result as any).properties?.Task?.title?.[0]?.plain_text ||
                   'Untitled';
      const url = result.url;
      output += `- [${title}](${url})\n`;
    }

    return output;
  }
}

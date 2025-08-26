import type { UseExtensionApiReturn } from '@/hooks/useExtensionApi'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface Model {
  id: string
  object: string
  created: number
  owned_by: string
}

export interface ChatCompletionChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta?: {
      role?: string
      content?: string
      reasoning_content?: string
    }
    finish_reason?: string | null
  }>
}

export class ExtensionAPI {
  private extensionApi: UseExtensionApiReturn

  constructor(extensionApi: UseExtensionApiReturn) {
    this.extensionApi = extensionApi
  }

  async fetchModels(): Promise<Model[]> {
    try {
      const response = await this.extensionApi.sendApiRequest('GET', '/v1/models')

      if (response.status !== 200) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }

      return response.body.data || []
    } catch (error) {
      throw new Error(`Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async *streamChatCompletion(
    messages: ChatMessage[],
    model: string = 'gpt-3.5-turbo',
    maxTokens: number = 1000
  ): AsyncGenerator<ChatCompletionChunk, void, unknown> {
    try {
      const requestBody = {
        model,
        messages,
        max_tokens: maxTokens,
        stream: true,
        temperature: 0.7,
      }

      const streamIterable = await this.extensionApi.sendStreamRequest('POST', '/v1/chat/completions', requestBody)

      for await (const chunk of streamIterable) {
        if (chunk.status && chunk.status !== 200) {
          throw new Error(`Chat completion failed: ${chunk.status}`)
        }

        if (chunk.body) {
          yield chunk.body as ChatCompletionChunk
        }
      }
    } catch (error) {
      throw new Error(`Chat completion failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

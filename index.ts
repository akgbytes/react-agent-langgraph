import { ChatGroq } from "@langchain/groq";
import { createAgent,tool } from "langchain";
import { TavilySearch } from "@langchain/tavily";
import { MemorySaver } from "@langchain/langgraph";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";
import z from "zod";

marked.setOptions({
  renderer: new TerminalRenderer() as any,
});

async function main() {

  const checkpointer = new MemorySaver();

  const calendarTool = tool(async ({input}) => {
    return `Today you have meeting with Rakesh on google meet`
  }, {
    name: "calendar_tool",
    description: "get info about calendar events",
    schema: z.object({
     input:z.string().describe("Input to use in calendar search event")
   })})

  const webSearch = new TavilySearch({
    maxResults: 5,
    topic: "general",
  });

  const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
  });

  const agent = createAgent({
    model,
    tools: [webSearch,calendarTool],
    systemPrompt: `You are a helpful assistant. Answer user's question politely and if you don't know the answer, use the suitable provided tools. Current date and time : ${new Date(Date.now())} .`,
    checkpointer,
  });


  while (true) {
    const userQuer = prompt("You: ")
    if (!userQuer || userQuer === "quit" || userQuer === "exit"){
      break;
    }

    const result = await agent.invoke({
      messages: [
        { role: "user", content: userQuer },
      ],
    },  { configurable: { thread_id: "thread-1" } });

    console.log(marked.parse(`Assistant: ${result.messages[result.messages.length-1]?.content}`));
}

}

main()

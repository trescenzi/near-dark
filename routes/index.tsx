import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum } from "@openai";

type ChatMessage = {
  role: ChatCompletionRequestMessageRoleEnum,
  content: string
}
interface Data {
  response: string;
  previous: ChatMessage[];
}

const configuration = new Configuration({
  organization: Deno.env.get("OPENAI_ORG_KEY"),
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});
const openai = new OpenAIApi(configuration);

async function askChatYvanna(question: string, previous: ChatMessage[]) {
  const description = await Deno.readTextFile("characters/yvanna-frontmatter.md");
  const chatMessages = [
      ...(previous.slice(previous.length - 5)),
      {
        role: 'user' as ChatCompletionRequestMessageRoleEnum,
        content: question,
      }
    ];

  console.log('ASKING', chatMessages);
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: 'system' as ChatCompletionRequestMessageRoleEnum,
        content: description,
      },
      ...chatMessages,
    ],
    temperature: 0.3,
  });
  console.log(response?.data?.choices?.[0]);
  return response?.data?.choices?.[0];
}

function buildPrevious(previousData: string) : ChatMessage[] {
  try {
    return JSON.parse(previousData);
  } catch {
    console.log('ERROR PARSING', previousData);
    return [];
  }
}
export const handler: Handlers<Data> = {
  async POST(req, ctx) {
    const text = (await req.text());
    const [prompt, _previous] = text.split('\r\n').map(text => text.replace(/.*=/,''));
    const previous = buildPrevious(_previous);
    console.log('PROMPT:', previous);
    const response = (await askChatYvanna(prompt, previous)).message?.content
    return ctx.render({
      response: response ?? 'Something went wrong',
      previous: [
        ...previous,
        {
          role: 'user',
          content: prompt
        } as ChatMessage,
        {
          role: 'assistant',
          content: response ?? '',
        } as ChatMessage,
      ],
    });
  },
};

export default function Home({ data }: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>The Town of Near Dark</title>
        <meta property="og:title" content="The Town of Near Dark" />
        <meta name="description" content="An AI driven experience about a town in the Underdark." />
        <meta charSet="utf-8" />
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <p class="my-6">
          You find yourself in an unfamilar tavern face to face with the barkeep. She looks at you inquisitively.
        </p>
        {data?.previous.map(({role, content}) => <p><b>{role === 'user' ? 'You:' : 'Yvanna:'}</b><i>{content}</i></p>)}
      <form method="POST" encType="text/plain" class="grid mt-4 md:gap-16 md:grid-flow-col gap-8">
        <input class="p-2 border-1 rounded border-gray" type="text" name="prompt" />
        <button type="submit" class="p-2 border-1 rounded bg-gray-200 border-gray-400 md:w-32 hover:bg-gray-300">Ask</button>
        <input type="hidden" value={JSON.stringify(data?.previous) ?? "[]"} name="previous" />
      </form>
      </div>
    </>
  );
}

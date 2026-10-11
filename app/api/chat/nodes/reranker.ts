export const reRankerNode: GraphNode<typeof messageState> = async (state) => {
  const model = getMODEL("openai/gpt-oss-120b");
  const systemText =
    state.route === "rag"
      ? getRagPrompt(state.context ?? "")
      : getSystemPrompt();
  const generatorResponse = await model.invoke([
    new SystemMessage(systemText),
    ...state.messages,
  ]);
  return {
    messages: [generatorResponse],
  };
};
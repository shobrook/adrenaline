import { Message } from "./dtos";

export const buildChatHistory = messages => {
    let startingMessages;
    if (!messages[messages.length - 1].isResponse) {
        startingMessages = messages.slice(0, messages.length - 1);
    } else if (!messages[messages.length - 1].isComplete) {
        startingMessages = messages.slice(0, messages.length - 2);
    } else {
        startingMessages = messages;
    }

    return startingMessages.slice(1).map(message => {
        return {
            content: message.content,
            is_response: message.isResponse,
        }
    });
}

export const buildWelcomeMessage = repositoryName => {
    const messageContent = `Hi, I'm your AI expert on ${repositoryName}. Ask me anything about this repository.`;
    const welcomeMessage = new Message(messageContent, true, true);
    
    return welcomeMessage;
}

export const isResponseLoading = message => {
    return message.isResponse && message.content == "" && !message.isComplete;
}
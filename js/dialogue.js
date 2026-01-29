// Enhanced dialogue system with branching conversations

class DialogueSystem {
    constructor() {
        this.conversations = new Map();
        this.currentConversation = null;
        this.currentNode = null;
    }

    addConversation(npcId, dialogueTree) {
        this.conversations.set(npcId, dialogueTree);
    }

    startConversation(npcId) {
        this.currentConversation = this.conversations.get(npcId);
        if (this.currentConversation) {
            this.currentNode = this.currentConversation.root;
            this.displayNode(this.currentNode);
        }
    }

    displayNode(node) {
        const dialogueBox = document.getElementById('dialogueBox');
        dialogueBox.style.display = 'block';
        
        dialogueBox.innerHTML = `
            <div style="font-size: 18px; color: #FFD700; text-shadow: 1px 1px 2px #000;">
                ${node.text}
            </div>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                ${node.options.map(option => `
                    <button class="button" onclick="dialogueSystem.selectOption(${option.id})" style="padding: 8px 16px; font-size: 14px;">
                        ${option.text}
                    </button>
                `).join('')}
            </div>
        `;
        
        // Speak the dialogue
        speak(node.text, VOICES[node.speaker] || VOICES.villager);
    }

    selectOption(optionId) {
        const currentNode = this.currentNode;
        const selectedOption = currentNode.options.find(opt => opt.id === optionId);
        
        if (selectedOption.nextNode) {
            this.currentNode = selectedOption.nextNode;
            this.displayNode(this.currentNode);
        } else {
            this.endConversation();
        }
    }

    endConversation() {
        document.getElementById('dialogueBox').style.display = 'none';
        this.currentConversation = null;
        this.currentNode = null;
    }

    createSimpleDialogue(npcType, text, speaker = npcType) {
        return {
            root: {
                id: 1,
                text: text,
                speaker: speaker,
                options: [
                    {
                        id: 1,
                        text: "Continue",
                        nextNode: null
                    }
                ]
            }
        };
    }

    createBranchingDialogue(npcType, text, options, speaker = npcType) {
        return {
            root: {
                id: 1,
                text: text,
                speaker: speaker,
                options: options
            }
        };
    }
}

// Add to global scope
window.dialogueSystem = new DialogueSystem();

import { defineContentScript } from 'wxt/sandbox';
import './popup/style.css'

export default defineContentScript({
  matches: ['*://*.linkedin.com/*'],
  main() {
    let currentMessageBox = null;
    let isModalOpen = false;
    let customButton = null;
    let modal = null;
    let overlay = null;
    let aiResponse = '';

    const createModal = () => {
      const modal = document.createElement('div');
      modal.id = 'customModal';
      modal.className = 'fixed left-1/2 top-1/2 z-50 flex w-1/2 -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-lg bg-white p-5 shadow-lg';
      
      modal.innerHTML = `
        <div id="chatArea" class="mb-3 flex-grow overflow-y-auto rounded border border-gray-300 p-3 hidden"></div>
        <input type="text" id="userInput" class="w-full rounded border border-gray-300 p-2" placeholder="Type your message..." />
        <div class="mt-3 flex justify-end gap-2">
          <button id="insertButton" class="w-1/3 rounded outline outline-2 outline-blue-600 px-3 py-2 text-blue-600 hover:bg-blue-100 hidden">Insert</button>
          <button id="generateButton" class="inline-flex w-1/3 justify-center items-center gap-2 rounded bg-blue-600 py-2 text-center text-white hover:bg-blue-700">Generate</button>
        </div>
      `;
    
      document.body.appendChild(modal);
    
      overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 hidden'; // Ensure this has the correct properties
      document.body.appendChild(overlay);
    
      const generateButton = modal.querySelector('#generateButton');
      const insertButton = modal.querySelector('#insertButton');
      const userInput = modal.querySelector('#userInput');
      const chatArea = modal.querySelector('#chatArea');
    
      generateButton.addEventListener('click', () => {
        const userMessage = userInput.value.trim();
        if (userMessage) {
          chatArea.classList.remove('hidden');
          addMessageToChatArea('user', userMessage);
          userInput.value = '';
          
          // Simulate AI response
          setTimeout(() => {
            const aiResponse = "Thank you for the opportunity! If you have any more questions or if there's anything else I can help you with, feel free to ask.";
            addMessageToChatArea('ai', aiResponse);
            insertButton.classList.remove('hidden');
            generateButton.textContent = 'Regenerate';
          }, 1000);
        }
      });
    
      userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          generateButton.click();
        }
      });
    
      insertButton.addEventListener('click', () => {
        insertTextIntoMessageBox(aiResponse);
      });
    
      return modal;
    };
    

    const addMessageToChatArea = (sender, message) => {
      const chatArea = modal.querySelector('#chatArea');
      const messageElement = document.createElement('div');
      messageElement.className = `mb-2 p-2 rounded-lg max-w-[80%] ${
        sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
      }`;
      
      messageElement.textContent = message;
      chatArea.appendChild(messageElement);
      chatArea.scrollTop = chatArea.scrollHeight;
    };

    const insertTextIntoMessageBox = (text) => {
      if (currentMessageBox && text) {
        const textNode = document.createTextNode(text);
        const paragraph = document.createElement('p');
        paragraph.appendChild(textNode);
        currentMessageBox.appendChild(paragraph);
        
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        currentMessageBox.dispatchEvent(inputEvent);
        
        closeModal();
        
        currentMessageBox.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(currentMessageBox);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };

    const openModal = () => {
      if (!modal) {
        modal = createModal();
      }
      modal.classList.remove('hidden');
      overlay.classList.remove('hidden'); // Ensure overlay is shown
      isModalOpen = true;
    
      if (customButton) customButton.classList.add('hidden');
      
      setTimeout(() => {
        modal.querySelector('#userInput').focus();
      }, 0);

      // Reset modal state
      modal.querySelector('#chatArea').classList.add('hidden');
      modal.querySelector('#insertButton').classList.add('hidden');
      modal.querySelector('#userInput').value = '';
      modal.querySelector('#generateButton').textContent = 'Generate';
    };

    const closeModal = () => {
      if (modal) {
        modal.classList.add('hidden');
        overlay.classList.add('hidden'); // Hide overlay
        isModalOpen = false;
    
        if (currentMessageBox) {
          setTimeout(() => {
            currentMessageBox.focus();
            addButtonToMessageBox(currentMessageBox);
          }, 0);
        }
      }
    };

    const addButtonToMessageBox = (messageBox) => {
      if (customButton) {
        customButton.classList.remove('hidden');
        return;
      }

      customButton = document.createElement('button');
      customButton.className = 'absolute bottom-2 right-3 m-2 rounded-full bg-blue-600 p-1.5 text-white hover:bg-blue-700';
      customButton.innerHTML = `<svg width="15px" height="15px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#ffffff">
                                <g id="SVGRepo_iconCarrier"> <title>magic</title> <desc>Created with sketchtool.</desc> <g id="web-app" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="magic" fill="#ffffff"> <path d="M3,5 L5,3 L21,19 L19,21 L3,5 Z M13,5 L14,3 L15,5 L17,6 L15,7 L14,9 L13,7 L11,6 L13,5 Z M5,15 L6,13 L7,15 L9,16 L7,17 L6,19 L5,17 L3,16 L5,15 Z M4,9 L5,10 L4,11 L3,10 L4,9 Z M18,10 L19,11 L18,12 L17,11 L18,10 Z" id="Shape"> </path> </g> </g> </g>
                                </svg>`

      customButton.addEventListener('click', (event) => {
        event.stopPropagation();
        openModal();
      });

      messageBox.parentNode.appendChild(customButton);
    };

    const removeButton = () => {
      if (customButton) {
        customButton.classList.add('hidden');
      }
    };

    const observeMessageBox = () => {
      const messageBox = document.querySelector('div.msg-form__contenteditable[contenteditable="true"]');
    
      if (messageBox !== currentMessageBox) {
        removeButton();
        currentMessageBox = messageBox;
    
        if (messageBox && !isModalOpen) {
          addButtonToMessageBox(messageBox);
    
          messageBox.addEventListener('focusout', (event) => {
            if (!event.relatedTarget || 
                (event.relatedTarget !== customButton && 
                 !event.relatedTarget.closest('#customModal'))) {
              removeButton();
            }
          });
    
          messageBox.addEventListener('focusin', () => {
            if (!isModalOpen) {
              addButtonToMessageBox(messageBox);
            }
          });
        }
      }
    };
    
    const handleOutsideClick = (event) => {
      if (isModalOpen && modal && !modal.contains(event.target) && event.target !== customButton) {
        closeModal();
      }
    };

    document.addEventListener('click', handleOutsideClick);

    const observer = new MutationObserver(observeMessageBox);
    observer.observe(document.body, { childList: true, subtree: true });

    observeMessageBox();
  },
});
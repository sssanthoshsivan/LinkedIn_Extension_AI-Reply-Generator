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
      modal = document.createElement('div');
      modal.id = 'customModal';
      modal.className = 'fixed left-1/2 top-1/2 z-50 flex w-1/2 -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-lg bg-white p-5 shadow-lg';
      
      modal.innerHTML = `
          <div id="chatArea" class="mb-3 flex-grow overflow-y-auto rounded border border-gray-300 p-3 hidden"></div>
          <input type="text" id="userInput" class="w-full rounded border border-gray-300 p-2" placeholder="Type your message..." />
          <div class="mt-2 flex justify-end gap-2">
            <button id="insertButton" class="w-1/3 rounded outline outline-2 outline-blue-600 px-3 py-2 text-blue-600 hover:bg-blue-100 hidden">Insert</button>
            <button id="generateButton" class="inline-flex w-1/3 justify-center gap-1 rounded bg-blue-600 py-2 text-center text-white hover:bg-blue-700">
              <svg width="25px" height="25px" viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff" stroke-width="0.00025">
                <g id="SVGRepo_iconCarrier"><path d="M19.1168 12.1484C19.474 12.3581 19.9336 12.2384 20.1432 11.8811C20.3528 11.5238 20.2331 11.0643 19.8758 10.8547L19.1168 12.1484ZM6.94331 4.13656L6.55624 4.77902L6.56378 4.78344L6.94331 4.13656ZM5.92408 4.1598L5.50816 3.5357L5.50816 3.5357L5.92408 4.1598ZM5.51031 5.09156L4.76841 5.20151C4.77575 5.25101 4.78802 5.29965 4.80505 5.34671L5.51031 5.09156ZM7.12405 11.7567C7.26496 12.1462 7.69495 12.3477 8.08446 12.2068C8.47397 12.0659 8.67549 11.6359 8.53458 11.2464L7.12405 11.7567ZM19.8758 12.1484C20.2331 11.9388 20.3528 11.4793 20.1432 11.122C19.9336 10.7648 19.474 10.6451 19.1168 10.8547L19.8758 12.1484ZM6.94331 18.8666L6.56375 18.2196L6.55627 18.2241L6.94331 18.8666ZM5.92408 18.8433L5.50815 19.4674H5.50815L5.92408 18.8433ZM5.51031 17.9116L4.80505 17.6564C4.78802 17.7035 4.77575 17.7521 4.76841 17.8016L5.51031 17.9116ZM8.53458 11.7567C8.67549 11.3672 8.47397 10.9372 8.08446 10.7963C7.69495 10.6554 7.26496 10.8569 7.12405 11.2464L8.53458 11.7567ZM19.4963 12.2516C19.9105 12.2516 20.2463 11.9158 20.2463 11.5016C20.2463 11.0873 19.9105 10.7516 19.4963 10.7516V12.2516ZM7.82931 10.7516C7.4151 10.7516 7.07931 11.0873 7.07931 11.5016C7.07931 11.9158 7.4151 12.2516 7.82931 12.2516V10.7516ZM19.8758 10.8547L7.32284 3.48968L6.56378 4.78344L19.1168 12.1484L19.8758 10.8547ZM7.33035 3.49414C6.76609 3.15419 6.05633 3.17038 5.50816 3.5357L6.34 4.78391C6.40506 4.74055 6.4893 4.73863 6.55627 4.77898L7.33035 3.49414ZM5.50816 3.5357C4.95998 3.90102 4.67184 4.54987 4.76841 5.20151L6.25221 4.98161C6.24075 4.90427 6.27494 4.82727 6.34 4.78391L5.50816 3.5357ZM4.80505 5.34671L7.12405 11.7567L8.53458 11.2464L6.21558 4.83641L4.80505 5.34671ZM19.1168 10.8547L6.56378 18.2197L7.32284 19.5134L19.8758 12.1484L19.1168 10.8547ZM6.55627 18.2241C6.4893 18.2645 6.40506 18.2626 6.34 18.2192L5.50815 19.4674C6.05633 19.8327 6.76609 19.8489 7.33035 19.509L6.55627 18.2241ZM6.34 18.2192C6.27494 18.1759 6.24075 18.0988 6.25221 18.0215L4.76841 17.8016C4.67184 18.4532 4.95998 19.1021 5.50815 19.4674L6.34 18.2192ZM6.21558 18.1667L8.53458 11.7567L7.12405 11.2464L4.80505 17.6564L6.21558 18.1667ZM19.4963 10.7516H7.82931V12.2516H19.4963V10.7516Z" fill="#ffffff" /></g></svg
              >Generate
            </button>
          </div>
      `;

      document.body.appendChild(modal);

      overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 hidden';
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
            aiResponse = "Thank you for the opportunity! If you have any more questions or if there's anything else I can help you with, feel free to ask.";
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
      overlay.classList.remove('hidden');
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
        overlay.classList.add('hidden');
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

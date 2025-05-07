// Notes Management
const glitchUrl = 'https://zenith-winter-fibula.glitch.me';
let notes = [];
let profiles = {};
let currentProfileId = null;

function getProfileIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('imageId');
}

function getNotesKey() {
    return `notes-${getProfileIdFromURL()}`;
}

function toggleNotes() {
    const notesContent = document.getElementById('notes-content');
    const toggleButton = document.getElementById('toggle-notes');
    if (notesContent.style.display === 'none') {
        notesContent.style.display = 'block';
        toggleButton.textContent = 'Hide Notes';
    } else {
        notesContent.style.display = 'none';
        toggleButton.textContent = '📝 Notes';
    }
}

async function loadNotes(profileId) {
    try {
      const res = await fetch(`${glitchUrl}/api/notes/${profileId}`);
      if (!res.ok) throw new Error("Failed to load notes");
      return await res.json();
    } catch (e) {
      console.error("Error fetching notes:", e);
      return [];
    }
  }

function saveNote() {
    const noteText = document.getElementById('new-note').value.trim();
    if (noteText) {
        const note = {
            id: Date.now(),
            text: noteText,
            timestamp: new Date().toLocaleString()
        };
        notes.push(note);
        localStorage.setItem(getNotesKey(), JSON.stringify(notes));
        document.getElementById('new-note').value = '';
        renderNotes();
    }
}

function deleteNote(id) {
    showModal("Delete this note?", {
        onConfirm: () => {
            notes = notes.filter(note => note.id !== id);
            localStorage.setItem(getNotesKey(), JSON.stringify(notes));
            renderNotes();
        }
    });    
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        showModal("Edit note:", {
            prompt: true,
            defaultValue: note.text,
            onConfirm: (newText) => {
                if (newText && newText.trim()) {
                    note.text = newText.trim();
                    note.timestamp = new Date().toLocaleString() + ' (edited)';
                    localStorage.setItem(getNotesKey(), JSON.stringify(notes));
                    renderNotes();
                }
            }
        });        
    }
}

function renderNotes() {
    const notesList = document.getElementById('notes-list');
    if (!notesList || !currentProfileId) return;

    const key = `notes-${currentProfileId}`;
    const storedNotes = JSON.parse(localStorage.getItem(key) || '[]');
    notes = storedNotes;
    
    notesList.innerHTML = storedNotes.map(note => `
        <div class="note-item">
            <p>${note.text}</p>
            <small>${note.timestamp}</small>
            <div class="note-actions">
                <button onclick="editNote(${note.id})" class="edit-btn">Edit</button>
                <button onclick="deleteNote(${note.id})" class="delete-person-btn">Delete</button>
            </div>
        </div>
    `).join('');
}



// Data management
class PersonProfile {
    constructor(id, name = "Your Connection", relationship = "", imageUrl = "profileimg.png") {
        this.id = id;
        this.name = name;
        this.relationship = relationship;
        this.imageUrl = imageUrl;
    }
}

// Update this function to load only the requested profile
function loadProfiles() {
    const savedProfiles = localStorage.getItem('profiles');

    if (savedProfiles) {
        profiles = JSON.parse(savedProfiles);
    } else {
        // First-time user: auto-create one profile
        const id = Date.now().toString();
        const newProfile = new PersonProfile(id);
        profiles[id] = newProfile;
        localStorage.setItem('profiles', JSON.stringify(profiles));
    }

    const profileId = getProfileIdFromURL() || Object.keys(profiles)[0];
    if (profileId && profiles[profileId]) {
        currentProfileId = profileId;
        switchProfile(profileId);
    }

    updateNavigation();
}
// Save profiles to localStorage
function saveProfiles() {
    localStorage.setItem('profiles', JSON.stringify(profiles));
}

// Add new person
function addNewPerson() {
    showModal("Add a new Connection Card?", {
        onConfirm: () => {
            const id = Date.now().toString();
            const newProfile = new PersonProfile(id,);
            profiles[id] = newProfile;
            saveProfiles();
            updateNavigation();
            switchProfile(id);
        }
    });    
}

// Delete profile
function deletePerson() {
    showModal("Are you sure you want to remove this Connection Card?", {
        onConfirm: () => {
            delete profiles[currentProfileId];
            saveProfiles();
            updateNavigation();
            switchProfile(Object.keys(profiles)[0]);
        }
    });    
}

// Switch profile
function switchProfile(id) {
    if (profiles[id]) {
        currentProfileId = id;
        updateUI(profiles[id]);
        history.replaceState(null, '', `?imageId=${id}`);
        renderNotes();

        // ⬇️ Load saved ideas for this profile
        const ideasKey = `aiIdeas-${currentProfileId}`;
        const savedIdeas = JSON.parse(localStorage.getItem(ideasKey) || '[]');
        if (savedIdeas.length > 0) {
            populateIdeaButtons(savedIdeas);
        } else {
            // Show placeholder
            const section = document.querySelector('.conversation-section');
            section.innerHTML = "<h3>Ways to Connect</h3><p>Tap on the titles below for more ideas!</p>";
        }
    }
}


// Update profile data
function updateUI(profile) {
    document.querySelector('.profile-image').src = profile.imageUrl || 'profileimg.png';
    document.getElementById('profileName').textContent = profile.name || "Your Connection";
    document.querySelector('h4').textContent = profile.relationship;
    document.querySelector('.nav-text').textContent = profile.name;
}

// Update navigation menu
function updateNavigation() {
    const breadcrumb = document.querySelector('.breadcrumb');
    breadcrumb.innerHTML = '';

    Object.values(profiles).forEach(profile => {
        const listItem = document.createElement('li');
        const anchor = document.createElement('a');
        anchor.href = `?imageId=${profile.id}`;
        anchor.textContent = profile.name;
        anchor.classList.add('nav-text');
        anchor.onclick = (event) => {
            event.preventDefault();
            switchProfile(profile.id);
            highlightActiveProfile(profile.id);
        };
        listItem.appendChild(anchor);
        breadcrumb.appendChild(listItem);
    });

    highlightActiveProfile(currentProfileId);
}

function highlightActiveProfile(id) {
    const navLinks = document.querySelectorAll('.breadcrumb a');
    navLinks.forEach(link => {
        if (link.href.includes(id)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Navigation
function toggleMenu() {
    const menuItems = document.querySelector('.menu-items');
    menuItems.classList.toggle('active');
}

function initializeNavigation() {
    const navLinks = document.querySelectorAll('.breadcrumb a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            
            this.classList.add('active');
            
            const content = document.querySelector('.content-wrapper');
            content.style.opacity = '0';
            
            setTimeout(() => {
                content.style.opacity = '1';
            }, 300);
        });
    });
    
    document.querySelector('.menu-items').classList.remove('active');
}

function handleImageChange(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const profileImage = document.querySelector('.profile-image');
            profileImage.src = event.target.result;
            if (currentProfileId && profiles[currentProfileId]) {
                profiles[currentProfileId].imageUrl = event.target.result;
            }
        };
        reader.readAsDataURL(file);
        document.getElementById("imageSaveBtn").style.display = "block";
    } else {
        showModal("Please select a valid image file.");
    }
}

function triggerImagePicker() {
    const input = document.getElementById('imageInput');
    input.click(); // Triggers the file selector
    input.addEventListener('change', handleImageChange); // Handles the selected file
}


function saveImageChanges() {
    saveProfiles();
    document.getElementById("imageInput").value = '';
    document.getElementById("imageSaveBtn").style.display = 'none';
    switchProfile(currentProfileId);
}

function toggleEditName() {
    const input = document.getElementById('nameInput');
    const saveButton = document.querySelector('.name-section .save-btn');
    const currentName = document.getElementById('profileName').textContent;
    input.style.display = input.style.display === 'none' ? 'block' : 'none';
    saveButton.style.display = input.style.display;
    saveButton.offsetHeight;
    saveButton.style.display = 'block';
    if (input.style.display === 'block') {
        input.value = currentName;
    }
}

function saveNameChanges() {
    const input = document.getElementById('nameInput');
    const newName = input.value.trim();
    if (currentProfileId && profiles[currentProfileId] && newName) {
        profiles[currentProfileId].name = newName;
        saveProfiles();
        switchProfile(currentProfileId);
        updateNavigation();
        input.style.display = 'none';
        document.querySelector('.name-section .save-btn').style.display = 'none';
    }
}

function toggleEditRelationship() {
    const input = document.getElementById('relationshipInput');
    const saveButton = document.getElementById('relationshipSaveBtn');
    const currentRelation = document.querySelector('h4').textContent;
    input.style.display = input.style.display === 'none' ? 'block' : 'none';
    saveButton.style.display = input.style.display;
    saveButton.offsetHeight; // force reflow before display change
    saveButton.style.display = 'block';
    if (input.style.display === 'block') {
        input.value = currentRelation;
    }
}

const tips = [
    "Start by sharing your own memory to help your loved one open up.",
    "If they seem confused, gently switch topics or ask simpler questions.",
    "Use a calm tone when speaking and stay patient.",
    "Let them guide the pace — it's okay to take pauses or tangents.",
    "It's okay if they repeat themselves. Be open and listen again.",
];

function rotateCareTips() {
    const tipElement = document.getElementById('careTip');
    let index = 0;
    setInterval(() => {
        tipElement.classList.add('fade');
        setTimeout(() => {
          index = (index + 1) % tips.length;
          tipElement.textContent = `💡 Tip: ${tips[index]}`;
          tipElement.classList.remove('fade');
        }, 400); // fade out before switching
    }, 7000);
}

async function fetchIdeasFromAI(description) {
    console.log("Sending description to AI:", description);

    // Show loading indicator
    const section = document.querySelector('.conversation-section');
    section.innerHTML = "<h3>Loading ways to connect...</h3><div class='loading-indicator'>Loading AI responses...</div>";

    try {
        const response = await fetch(`${glitchUrl}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description })
        });

        if (!response.ok) {
            console.error(`Error: ${response.status} - ${response.statusText}`); // Log detailed error
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        console.log("AI response:", data);

        if (!data || !data.content) {
            useFallbackIdeas(section, description);
            return;
        }
  // Try to parse the JSON content from the AI
  try {
    let ideas;
    if (typeof data.content === 'string') {
        ideas = JSON.parse(data.content);
    } else {
        ideas = data.content; // If it's already an object
    }
    localStorage.setItem(`aiIdeas-${currentProfileId}`, JSON.stringify(ideas));
    populateIdeaButtons(ideas);
} catch (e) {
    console.error("Failed to parse AI output:", e);
    useFallbackIdeas(section, description);
}
} catch (error) {
console.error("Fetch error:", error);

useFallbackIdeas(section, description);
}
}

function saveRelationshipChanges() {
    const input = document.getElementById('relationshipInput');
    const description = input.value.trim();

    if (currentProfileId && profiles[currentProfileId]) {
        profiles[currentProfileId].relationship = description;
        document.querySelector('h4').textContent = description;
        saveProfiles();

        input.style.display = 'none';
        document.getElementById('relationshipSaveBtn').style.display = 'none';

       // Call AI for suggestions right after saving
       if (description && description.length > 5) {
        const loadingMsg = document.createElement('div');
        loadingMsg.id = 'ai-loading';
        loadingMsg.className = 'loading-indicator';
        loadingMsg.textContent = 'Getting AI suggestions...';
        document.querySelector('.conversation-section').appendChild(loadingMsg);

        localStorage.setItem(`description-${currentProfileId}`, relationshipInput.value);


        fetchIdeasFromAI(description);
        }
    }
}

const imageId = new URLSearchParams(window.location.search).get("imageId");
currentProfileId = imageId;

function populateIdeaButtons(ideas) {
    const section = document.querySelector('.conversation-section');

    const tipElement = document.getElementById("careTip");
    const tipWrapper = tipElement?.parentElement?.cloneNode(true);

    // Remove default/fallback "Type a description..." buttons if they exist
    const defaultButtons = section.querySelector('.conversations-list');
    if (defaultButtons) {
        defaultButtons.remove();
    }

    section.innerHTML = "<h3>Ways to Connect</h3><p>Tap on the titles below for more ideas!</p>";

    // const tips = document.getElementById("careTip");
    // if (tips && !section.contains(tips)) {
    //     section.appendChild(tips);
    // }

    const container = document.createElement('div');
    container.className = 'ideas-container';

    ideas.forEach((idea) => {
        const ideaBlock = document.createElement('div');
        ideaBlock.className = 'idea-block';

        const button = document.createElement('button');
        button.className = 'topic-button';
        button.textContent = idea.title || "Conversation Topic";

        button.onclick = () => {
            let content = `<strong>${idea.title || "Conversation Topic"}</strong><br><br>`;

            if (idea.questions?.length) {
                content += "<strong>Conversation Starters:</strong><br>";
                idea.questions.forEach(q => content += `<li>${q}</li>`);
                content += "</ul>";
            }

            if (idea.activities?.length) {
                content += "<br><strong>Activities:</strong><br>";
                idea.activities.forEach(a => content += `<li>${a}</li>`);
                content += "</ul>";
            }

            if (idea.selfcare?.length) {
                content += "<br><strong>Take time for yourself:</strong><br>";
                idea.selfcare.forEach(a => content += `<li>${a}</li>`);
                content += "</ul>";
            }

            showModal(content, { htmlContent: true });
        };

        ideaBlock.appendChild(button);
        container.appendChild(ideaBlock);
    });

    section.appendChild(container);

    const noteSection = document.createElement('div');
    noteSection.className = 'profile-note-section';

    const noteInput = document.createElement('textarea');
    noteInput.placeholder = "Write a note about your conversation or activities...";
    noteInput.className = 'note-textarea';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-note-btn';
    saveBtn.textContent = 'Save Note';

    const noteList = document.createElement('div');
    noteList.className = 'note-list';

    const key = `notes-${currentProfileId}`;  // Properly scoped per profile

    saveBtn.onclick = () => {
        const text = noteInput.value.trim();
        if (text && currentProfileId) {
            const note = {
                id: Date.now(),
                text: text,
                timestamp: new Date().toLocaleString()
            };
            const allNotes = JSON.parse(localStorage.getItem(key) || '[]');
            allNotes.push(note);
            localStorage.setItem(key, JSON.stringify(allNotes));
            noteInput.value = '';
            renderProfileNotes(noteList, key);
        }
    };

    renderProfileNotes(noteList, key);

    noteSection.appendChild(noteInput);
    noteSection.appendChild(saveBtn);
    noteSection.appendChild(noteList);

    section.appendChild(noteSection);

}

function renderProfileNotes(container, storageKey) {
    const notes = JSON.parse(localStorage.getItem(storageKey) || '[]');
    container.innerHTML = notes.map(note => `
        <div class="note-item">
            <p>${note.text}</p>
            <small>${note.timestamp}</small>
            <div class="note-actions">
                <button class="delete-person-btn" onclick="deleteProfileNote('${storageKey}', ${note.id}, this)">Delete</button>
            </div>
        </div>
    `).join('');
    }

function deleteProfileNote(key, noteId, btn) {
    let notes = JSON.parse(localStorage.getItem(key) || '[]');
    notes = notes.filter(n => n.id !== noteId);
    localStorage.setItem(key, JSON.stringify(notes));
    renderProfileNotes(btn.closest('.note-list'), key);
}

// Load and show notes for this profile
    if (currentProfileId) {
        loadNotes(currentProfileId).then(profileNotes => {
        if (profileNotes && profileNotes.length > 0) {
            notesContainer.innerHTML = "<h4>Notes about this person:</h4>" + profileNotes.map(note => `
            <div class="note-item">
                <p>${note.text}</p>
                <small>${note.timestamp}</small>
            </div>
            `).join('');
        } else {
            notesContainer.innerHTML = "<small>No notes yet.</small>";
        }
        });

        container.appendChild(notesContainer);
    }
function displayIdeas(text) {
    const section = document.querySelector('.conversation-section');
    section.innerHTML = "<h3>Ideas</h3><div class='ideas-container'></div>";

    const ideasContainer = section.querySelector('.ideas-container');
    const lines = text.split('\n').filter(l => l.trim());

    lines.forEach((line, i) => {
        const button = document.createElement('button');
        button.className = 'idea-button';
        button.textContent = line.replace(/^[-*•\d.]+/, '').trim();
        button.onclick = () => showModal(line);
        ideasContainer.appendChild(button);
    });
}

function showTopic(topic) {
    const topics = {
        family: [
            "Conversation starters and activity ideas will show here. Type in a description or topic using the 'Add short description' buttton above to get ideas!"
        ],
        food: [
            "Conversation starters and activity ideas will show here. Type in a description or topic using the 'Add short description' buttton above to get ideas!"
        ],
        hobbies: [
            "Conversation starters and activity ideas will show here. Type in a description or topic using the 'Add short description' buttton above to get ideas!"
        ]
    };

    const questions = topics[topic];
    if (!questions) return;

    showModal(`Conversation Topic: ${topic.charAt(0).toUpperCase() + topic.slice(1)}\n\nQuestions:\n${questions.join('\n')}`);
}

function showModal(message, options = {}) {
    const modal = document.getElementById("customModal");
    const modalMessage = document.getElementById("modalMessage");
    const modalInput = document.getElementById("modalInput");
    const confirmBtn = document.getElementById("modalConfirm");
    const cancelBtn = document.getElementById("modalCancel");
    const closeModal = document.getElementById("closeModal");

    if (options.htmlContent) {
        modalMessage.innerHTML = message;
          
    } else {
        modalMessage.textContent = message;
    }
    
    modalInput.style.display = options.prompt ? 'block' : 'none';
    modalInput.value = options.defaultValue || '';

    modal.style.display = "flex";
    confirmBtn.focus();

    confirmBtn.onclick = () => {
        modal.style.display = "none";
        if (options.onConfirm) {
            const val = options.prompt ? modalInput.value : true;
            options.onConfirm(val);
        }
    };

    cancelBtn.onclick = closeModal.onclick = () => {
        modal.style.display = "none";
        if (options.onCancel) options.onCancel();
    };
}

document.addEventListener('DOMContentLoaded', function() {
   
    const input = document.getElementById('imageInput');
    if (input) {
        input.addEventListener('change', handleImageChange)
    }
   
    loadProfiles();
    initializeNavigation();
    rotateCareTips();
    testGlitchConnection().then(connected => console.log(connected));
});

document.addEventListener('DOMContentLoaded', function() {

    testGlitchConnection().then(connected => {
        if (connected) {
            console.log("Glitch server is available");
        } else {
            console.log("Glitch server is not available");
        }
    });
});

function generateConversationIdeas() {
    const description = document.querySelector('h4').textContent.trim();
    
    if (description && description.length > 5) {
        const section = document.querySelector('.conversation-section');
        section.innerHTML = "<h3>Loading ways to connect...</h3><div class='loading-indicator'>Loading AI responses...</div>";
        
        fetchIdeasFromAI(description);
    } else {
        showModal("Please add a more detailed description first (at least 5 characters).");
    }
}

function renderIdeaNotes(container, storageKey) {
    const notes = JSON.parse(localStorage.getItem(storageKey) || '[]');
    container.innerHTML = notes.map(note => `
        <div class="note-item">
            <p>${note.text}</p>
            <small>${note.timestamp}</small>
            <div class="note-actions">
            <button class="save-note-btn">Save</button>
            <button class="delete-person-btn" onclick="...">Delete</button>
            </div>

        </div>
    `).join('');
}

function deleteIdeaNote(key, noteId, btn) {
    let notes = JSON.parse(localStorage.getItem(key) || '[]');
    notes = notes.filter(n => n.id !== noteId);
    localStorage.setItem(key, JSON.stringify(notes));
    renderIdeaNotes(btn.closest('.note-list'), key);
}

function toggleEditConnection() {
    const section = document.getElementById('editControls');
    if (!section) return;
    section.style.display = (section.style.display === 'none' || section.style.display === '') ? 'block' : 'none';
}

const API_URL = '/api/topics';
const STATS_URL = '/api/stats';
let allTopics = [];
let currentCategory = 'All';
let currentStatus = '';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  fetchTopics();
  fetchStats();
  document.getElementById('topicForm').addEventListener('submit', handleFormSubmit);
});

async function fetchTopics() {
  try {
    let url = API_URL;
    const params = new URLSearchParams();
    if (currentStatus) params.append('status', currentStatus);
    if (searchQuery) params.append('q', searchQuery);
    if (currentCategory !== 'All') params.append('category', currentCategory);

    if (params.toString()) url += `?${params.toString()}`;

    const response = await fetch(url);
    allTopics = await response.json();

    // If category filter is applied client-side alongside backend search
    let displayedTopics = allTopics;
    if (currentCategory !== 'All') {
      displayedTopics = allTopics.filter(t => t.category === currentCategory);
    }

    renderCategoryDatalist();
    renderFilters();
    renderTopics(displayedTopics);
  } catch (err) {
    console.error('Error fetching topics:', err);
  }
}

async function fetchStats() {
  try {
    const response = await fetch(STATS_URL);
    const stats = await response.json();

    document.getElementById('statTotal').innerText = stats.total || 0;
    document.getElementById('statTodo').innerText = stats.todo || 0;
    document.getElementById('statLearning').innerText = stats.learning || 0;
    document.getElementById('statRevised').innerText = stats.revised || 0;
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

function renderCategoryDatalist() {
  const datalist = document.getElementById('categoryList');
  const categories = [...new Set(allTopics.map(t => t.category))].filter(Boolean);
  datalist.innerHTML = categories.map(c => `<option value="${c}">`).join('');
}

function renderFilters() {
  const container = document.getElementById('categoryFilters');
  // Get unique categories from fetched collection
  const categories = ['All', ...new Set(allTopics.map(t => t.category))].filter(Boolean);

  container.innerHTML = categories.map(cat => `
        <button class="pill ${currentCategory === cat ? 'active' : ''}" onclick="setCategoryFilter('${cat}')">
            ${cat}
        </button>
    `).join('');
}

window.setCategoryFilter = function(cat) {
  currentCategory = cat;
  fetchTopics();
}

window.handleSearch = function() {
  searchQuery = document.getElementById('searchInput').value.trim();
  fetchTopics();
}

window.handleStatusFilter = function() {
  currentStatus = document.getElementById('statusFilter').value;
  fetchTopics();
}

function renderTopics(topics) {
  const container = document.getElementById('topicsContainer');

  if (topics.length === 0) {
    container.innerHTML = `<p class="empty-state">No topics found matching your filters.</p>`;
    return;
  }

  container.innerHTML = topics.map(topic => {
    // Smart URL detector: turns http/https links in notes into a clickable button
    let formattedNotes = topic.notes || 'No notes added.';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let linkButton = '';

    if (urlRegex.test(topic.notes)) {
      const matchedUrl = topic.notes.match(urlRegex)[0];
      formattedNotes = topic.notes.replace(urlRegex, '');
      linkButton = `<a href="${matchedUrl}" target="_blank" class="btn-link">🔗 Open Link</a>`;
    }

    return `
            <div class="topic-card">
                <div class="topic-header">
                    <span class="badge">${topic.category || 'General'}</span>
                    <span class="status status-${topic.status}">${topic.status}</span>
                </div>
                <h3>${topic.title}</h3>
                <p class="notes">${formattedNotes}</p>
                <div class="topic-footer">
                    ${linkButton}
                    <button class="btn-delete" onclick="deleteTopic('${topic._id}')">Delete</button>
                </div>
            </div>
        `;
  }).join('');
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const categoryInput = document.getElementById('category').value.trim();
  const titleInput = document.getElementById('title').value.trim();
  const statusInput = document.getElementById('status').value;
  const notesInput = document.getElementById('notes').value.trim();

  const newTopic = {
    category: categoryInput,
    title: titleInput,
    status: statusInput,
    notes: notesInput
  };

  console.log("Sending new topic:", newTopic); // Debug log

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTopic)
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById('topicForm').reset();
      fetchTopics();
      fetchStats();
    } else {
      alert('Failed to save: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error saving topic:', err);
    alert('Network error or server is down. Check your terminal.');
  }
}

window.deleteTopic = async function(id) {
  if (!confirm('Are you sure you want to delete this topic?')) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (response.ok) {
      fetchTopics();
      fetchStats();
    }
  } catch (err) {
    console.error('Error deleting topic:', err);
  }
}